from python_ide.analyzer import analyze_code


def test_allows_stdlib_imports() -> None:
    result = analyze_code("import math\nprint(math.sqrt(9))")
    assert result.safety == "allow"
    assert result.allowed_imports == ["math"]


def test_allows_curated_packages() -> None:
    result = analyze_code("import numpy as np\nprint(np.array([1, 2, 3]))")
    assert result.safety == "allow"
    assert result.allowed_imports == ["numpy"]


def test_blocks_network_and_process_imports() -> None:
    result = analyze_code("import subprocess\nfrom urllib import request")
    assert result.safety == "block"
    assert "subprocess" in result.blocked_imports
    assert "urllib.request" in result.blocked_imports


def test_blocks_browser_bridge_imports() -> None:
    result = analyze_code("import js\nfrom pyodide import ffi")
    assert result.safety == "block"
    assert "js" in result.blocked_imports
    assert "pyodide.ffi" in result.blocked_imports


def test_blocks_operator_attr_helpers() -> None:
    result = analyze_code("from operator import attrgetter")
    assert result.safety == "block"
    assert "operator.attrgetter" in result.blocked_imports


def test_blocks_dynamic_execution_calls() -> None:
    result = analyze_code("eval('1 + 1')\ncompile('x=1', 'x.py', 'exec')")
    assert result.safety == "block"
    assert {item.category for item in result.safety_findings} == {"blocked-call"}


def test_blocks_reflection_calls() -> None:
    result = analyze_code('getattr(input, "__globals__")\nvars(input)')
    assert result.safety == "block"
    assert {item.category for item in result.safety_findings} == {"blocked-reflection"}


def test_blocks_format_string_introspection_bypass() -> None:
    result = analyze_code('print("{0.__globals__[os].environ[RENDER_SERVICE_ID]}".format(input))')
    assert result.safety == "block"
    assert result.safety_findings[0].category == "blocked-format-string"


def test_warns_for_virtual_file_access() -> None:
    result = analyze_code("with open('notes.txt', 'w') as f:\n    f.write('hello')")
    assert result.safety == "warn"
    assert result.safety_findings[0].category == "virtual-filesystem"


def test_reports_beginner_diagnostics() -> None:
    result = analyze_code("items = [1, 2, 3]\nfor i in range(len(items) + 1):\n    print(items[i])")
    assert "loop-boundary" in {item.category for item in result.diagnostics}
