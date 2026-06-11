"""Static checks for beginner Python snippets."""

from __future__ import annotations

import ast
import builtins
import textwrap
from dataclasses import dataclass, field
from typing import Iterable


BUILTIN_NAMES = set(dir(builtins))
COMMON_IMPORT_ALIASES = {"np", "pd", "plt"}


@dataclass
class Diagnostic:
    category: str
    message: str
    line: int | None = None
    severity: str = "info"


@dataclass
class AnalysisResult:
    syntax_ok: bool
    diagnostics: list[Diagnostic] = field(default_factory=list)

    def to_prompt_context(self) -> str:
        lines = [f"Syntax OK: {self.syntax_ok}"]
        if self.diagnostics:
            lines.append("Diagnostics:")
            for item in self.diagnostics:
                location = f" line {item.line}" if item.line else ""
                lines.append(f"- [{item.severity}] {item.category}{location}: {item.message}")
        return "\n".join(lines)


class _BeginnerVisitor(ast.NodeVisitor):
    def __init__(self) -> None:
        self.assigned: set[str] = set()
        self.loaded: list[tuple[str, int]] = []
        self.imported: set[str] = set()
        self.diagnostics: list[Diagnostic] = []

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.assigned.add(node.name)
        for arg in node.args.args + node.args.kwonlyargs:
            self.assigned.add(arg.arg)
        if node.args.vararg:
            self.assigned.add(node.args.vararg.arg)
        if node.args.kwarg:
            self.assigned.add(node.args.kwarg.arg)

        for default in list(node.args.defaults) + list(node.args.kw_defaults):
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.diagnostics.append(
                    Diagnostic(
                        category="mutable-default",
                        line=default.lineno,
                        severity="warning",
                        message=(
                            "A list, dict, or set used as a default argument is shared "
                            "between calls. Use None and create the value inside the function."
                        ),
                    )
                )
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self.visit_FunctionDef(node)  # type: ignore[arg-type]

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            self.imported.add(alias.asname or alias.name.split(".")[0])

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        for alias in node.names:
            self.imported.add(alias.asname or alias.name)

    def visit_Name(self, node: ast.Name) -> None:
        if isinstance(node.ctx, (ast.Store, ast.Del)):
            self.assigned.add(node.id)
        elif isinstance(node.ctx, ast.Load):
            self.loaded.append((node.id, node.lineno))
        self.generic_visit(node)

    def visit_For(self, node: ast.For) -> None:
        if isinstance(node.target, ast.Name):
            self.assigned.add(node.target.id)
        self.generic_visit(node)

    def visit_ListComp(self, node: ast.ListComp) -> None:
        self._visit_comprehension(node.generators)
        self.generic_visit(node)

    def visit_SetComp(self, node: ast.SetComp) -> None:
        self._visit_comprehension(node.generators)
        self.generic_visit(node)

    def visit_DictComp(self, node: ast.DictComp) -> None:
        self._visit_comprehension(node.generators)
        self.generic_visit(node)

    def visit_GeneratorExp(self, node: ast.GeneratorExp) -> None:
        self._visit_comprehension(node.generators)
        self.generic_visit(node)

    def _visit_comprehension(self, generators: Iterable[ast.comprehension]) -> None:
        for generator in generators:
            if isinstance(generator.target, ast.Name):
                self.assigned.add(generator.target.id)


def analyze_code(code: str) -> AnalysisResult:
    normalized = textwrap.dedent(code).strip("\n")
    diagnostics: list[Diagnostic] = []

    try:
        tree = ast.parse(normalized or "\n")
    except SyntaxError as exc:
        diagnostics.append(
            Diagnostic(
                category="syntax",
                line=exc.lineno,
                severity="error",
                message=exc.msg,
            )
        )
        return AnalysisResult(syntax_ok=False, diagnostics=diagnostics)

    visitor = _BeginnerVisitor()
    visitor.visit(tree)
    diagnostics.extend(visitor.diagnostics)
    diagnostics.extend(_undefined_name_diagnostics(visitor))
    diagnostics.extend(_style_heuristics(normalized, tree))

    return AnalysisResult(syntax_ok=True, diagnostics=diagnostics)


def _undefined_name_diagnostics(visitor: _BeginnerVisitor) -> list[Diagnostic]:
    known = visitor.assigned | visitor.imported | BUILTIN_NAMES | COMMON_IMPORT_ALIASES
    seen: set[str] = set()
    diagnostics: list[Diagnostic] = []
    for name, line in visitor.loaded:
        if name in seen or name in known:
            continue
        seen.add(name)
        diagnostics.append(
            Diagnostic(
                category="undefined-name",
                line=line,
                severity="warning",
                message=f"`{name}` is used before it is assigned or imported.",
            )
        )
    return diagnostics


def _style_heuristics(code: str, tree: ast.AST) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    compact = code.replace(" ", "")
    if "range(len(" in compact and "+1" in compact:
        diagnostics.append(
            Diagnostic(
                category="loop-boundary",
                severity="warning",
                message=(
                    "`range(len(items) + 1)` usually steps one position past the last valid "
                    "index. Check whether you meant `range(len(items))`."
                ),
            )
        )
    if "==[]" in compact or "len(" in compact and ")==0" in compact:
        diagnostics.append(
            Diagnostic(
                category="python-idiom",
                severity="info",
                message="Python usually reads more clearly with `if not items:` for empty collections.",
            )
        )

    has_function = any(isinstance(node, ast.FunctionDef) for node in ast.walk(tree))
    has_print = any(
        isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print"
        for node in ast.walk(tree)
    )
    if has_print and not has_function and len(code.splitlines()) > 6:
        diagnostics.append(
            Diagnostic(
                category="structure",
                severity="info",
                message="For longer snippets, consider moving repeated work into a small function.",
            )
        )
    return diagnostics
