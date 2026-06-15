from __future__ import annotations

import ast
import builtins
import sys
import textwrap
from dataclasses import asdict, dataclass, field
from typing import Iterable, Literal


SafetyLevel = Literal["allow", "warn", "block"]

ALLOWED_PACKAGES = {"numpy", "pandas", "matplotlib"}
BLOCKED_IMPORTS = {
    "cffi",
    "ctypes",
    "http.client",
    "js",
    "micropip",
    "pyodide",
    "requests",
    "socket",
    "subprocess",
    "urllib",
}
BLOCKED_CALLS = {"eval", "exec", "compile", "__import__"}
VIRTUAL_FILE_CALLS = {"open"}
DESTRUCTIVE_FILE_METHODS = {"remove", "removedirs", "rmdir", "unlink", "write_bytes", "write_text"}
STDLIB_MODULES = set(getattr(sys, "stdlib_module_names", set()))
BUILTIN_NAMES = set(dir(builtins))
COMMON_IMPORT_ALIASES = {"np", "pd", "plt"}


@dataclass
class Diagnostic:
    category: str
    message: str
    line: int | None = None
    severity: str = "info"


@dataclass
class SafetyFinding:
    category: str
    message: str
    line: int | None = None
    severity: Literal["warning", "error"] = "warning"


@dataclass
class AnalysisResult:
    syntax_ok: bool
    diagnostics: list[Diagnostic] = field(default_factory=list)
    safety: SafetyLevel = "allow"
    safety_findings: list[SafetyFinding] = field(default_factory=list)
    allowed_imports: list[str] = field(default_factory=list)
    blocked_imports: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return {
            "syntax_ok": self.syntax_ok,
            "diagnostics": [asdict(item) for item in self.diagnostics],
            "safety": self.safety,
            "safety_findings": [asdict(item) for item in self.safety_findings],
            "allowed_imports": self.allowed_imports,
            "blocked_imports": self.blocked_imports,
            "allowed_packages": sorted(ALLOWED_PACKAGES),
        }

    def to_prompt_context(self) -> str:
        lines = [f"Syntax OK: {self.syntax_ok}", f"Safety: {self.safety}"]
        if self.diagnostics:
            lines.append("Diagnostics:")
            for item in self.diagnostics:
                location = f" line {item.line}" if item.line else ""
                lines.append(f"- [{item.severity}] {item.category}{location}: {item.message}")
        if self.safety_findings:
            lines.append("Safety findings:")
            for item in self.safety_findings:
                location = f" line {item.line}" if item.line else ""
                lines.append(f"- [{item.severity}] {item.category}{location}: {item.message}")
        return "\n".join(lines)


class _Visitor(ast.NodeVisitor):
    def __init__(self) -> None:
        self.assigned: set[str] = set()
        self.loaded: list[tuple[str, int]] = []
        self.imported: set[str] = set()
        self.allowed_imports: set[str] = set()
        self.blocked_imports: set[str] = set()
        self.diagnostics: list[Diagnostic] = []
        self.safety_findings: list[SafetyFinding] = []

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            self._record_import(alias.name, alias.asname, node.lineno)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = "." * node.level + (node.module or "")
        for alias in node.names:
            name = module if alias.name == "*" else f"{module}.{alias.name}" if module else alias.name
            self._record_import(name, alias.asname or alias.name, node.lineno)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.assigned.add(node.name)
        for arg in node.args.args + node.args.kwonlyargs:
            self.assigned.add(arg.arg)
        if node.args.vararg:
            self.assigned.add(node.args.vararg.arg)
        if node.args.kwarg:
            self.assigned.add(node.args.kwarg.arg)

        for default in list(node.args.defaults) + [item for item in node.args.kw_defaults if item is not None]:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.diagnostics.append(
                    Diagnostic(
                        category="mutable-default",
                        line=default.lineno,
                        severity="warning",
                        message="A mutable default argument is shared between calls. Use None and create the value inside the function.",
                    )
                )
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self.visit_FunctionDef(node)  # type: ignore[arg-type]

    def visit_Name(self, node: ast.Name) -> None:
        if isinstance(node.ctx, (ast.Store, ast.Del)):
            self.assigned.add(node.id)
        elif isinstance(node.ctx, ast.Load):
            self.loaded.append((node.id, node.lineno))
        self.generic_visit(node)

    def visit_For(self, node: ast.For) -> None:
        self._assign_target(node.target)
        self.generic_visit(node)

    def visit_With(self, node: ast.With) -> None:
        for item in node.items:
            if item.optional_vars is not None:
                self._assign_target(item.optional_vars)
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

    def visit_Call(self, node: ast.Call) -> None:
        if isinstance(node.func, ast.Name):
            name = node.func.id
            if name in BLOCKED_CALLS:
                self.safety_findings.append(
                    SafetyFinding(
                        category="blocked-call",
                        line=node.lineno,
                        severity="error",
                        message=f"`{name}` is blocked in the IDE runner.",
                    )
                )
            if name in VIRTUAL_FILE_CALLS:
                self.safety_findings.append(
                    SafetyFinding(
                        category="virtual-filesystem",
                        line=node.lineno,
                        severity="warning",
                        message="File access uses the browser's virtual project filesystem, not your real computer.",
                    )
                )
        if isinstance(node.func, ast.Attribute) and node.func.attr in DESTRUCTIVE_FILE_METHODS:
            self.safety_findings.append(
                SafetyFinding(
                    category="destructive-file-operation",
                    line=node.lineno,
                    severity="warning",
                    message=f"`{node.func.attr}` may change virtual project files. Check the target path before running.",
                )
            )
        self.generic_visit(node)

    def _record_import(self, name: str, assigned_name: str | None, line: int) -> None:
        normalized = name.lstrip(".")
        root = normalized.split(".")[0]
        if assigned_name:
            self.imported.add(assigned_name.split(".")[0])
        else:
            self.imported.add(root)

        if _is_blocked_import(normalized):
            self.blocked_imports.add(normalized)
            self.safety_findings.append(
                SafetyFinding(
                    category="blocked-import",
                    line=line,
                    severity="error",
                    message=f"`{normalized}` is blocked because it can access the browser, network, subprocesses, or unsafe native interfaces.",
                )
            )
            return

        if _is_allowed_import(normalized):
            self.allowed_imports.add(normalized)
            return

        self.blocked_imports.add(normalized)
        self.safety_findings.append(
            SafetyFinding(
                category="unapproved-import",
                line=line,
                severity="error",
                message=f"`{normalized}` is not in the standard library or curated package allowlist.",
            )
        )

    def _assign_target(self, target: ast.AST) -> None:
        if isinstance(target, ast.Name):
            self.assigned.add(target.id)
        elif isinstance(target, (ast.Tuple, ast.List)):
            for child in target.elts:
                self._assign_target(child)

    def _visit_comprehension(self, generators: Iterable[ast.comprehension]) -> None:
        for generator in generators:
            self._assign_target(generator.target)


def analyze_code(code: str) -> AnalysisResult:
    normalized = textwrap.dedent(code).strip("\n")
    diagnostics: list[Diagnostic] = []

    try:
        tree = ast.parse(normalized or "\n")
    except SyntaxError as exc:
        diagnostics.append(Diagnostic(category="syntax", line=exc.lineno, severity="error", message=exc.msg))
        return AnalysisResult(syntax_ok=False, diagnostics=diagnostics)

    visitor = _Visitor()
    visitor.visit(tree)
    diagnostics.extend(visitor.diagnostics)
    diagnostics.extend(_undefined_name_diagnostics(visitor))
    diagnostics.extend(_style_heuristics(normalized, tree))

    safety: SafetyLevel = "allow"
    if any(item.severity == "error" for item in visitor.safety_findings):
        safety = "block"
    elif visitor.safety_findings:
        safety = "warn"

    return AnalysisResult(
        syntax_ok=True,
        diagnostics=diagnostics,
        safety=safety,
        safety_findings=visitor.safety_findings,
        allowed_imports=sorted(visitor.allowed_imports),
        blocked_imports=sorted(visitor.blocked_imports),
    )


def _undefined_name_diagnostics(visitor: _Visitor) -> list[Diagnostic]:
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
                message="`range(len(items) + 1)` usually steps one position past the last valid index.",
            )
        )
    if "==[]" in compact or ("len(" in compact and ")==0" in compact):
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


def _is_blocked_import(name: str) -> bool:
    if not name:
        return False
    root = name.split(".")[0]
    for blocked in BLOCKED_IMPORTS:
        if name == blocked or name.startswith(f"{blocked}."):
            return True
    return root in BLOCKED_IMPORTS


def _is_allowed_import(name: str) -> bool:
    if not name:
        return False
    root = name.split(".")[0]
    return root in STDLIB_MODULES or root in ALLOWED_PACKAGES

