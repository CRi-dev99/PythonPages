(function(){let e=`0.29.0`,t=`https://cdn.jsdelivr.net/pyodide/v${e}/full/pyodide.mjs`,n=`https://cdn.jsdelivr.net/pyodide/v${e}/full/`,r=null,i=``,a=[],o=``,s=``,c=0,l=new Set([`numpy`,`pandas`,`matplotlib`]),u=new Map([[`np`,`numpy`],[`pd`,`pandas`],[`plt`,`matplotlib`]]);self.onmessage=async e=>{let t=e.data;try{t.type===`init`&&(await d(),postMessage({type:`ready`})),t.type===`run`&&(i=String(t.code||``),a=[],await f(++c)),t.type===`input`&&(a.push(String(t.value??``)),await f(++c))}catch(e){postMessage({type:`error`,error:e instanceof Error?e.message:String(e)})}};async function d(){if(r)return r;postMessage({type:`status`,message:`Loading Python runtime...`});let e=await(await import(t)).loadPyodide({indexURL:n});return e.setStdout({batched:e=>o+=`${e}\n`}),e.setStderr({batched:e=>s+=`${e}\n`}),r=e,e}async function f(e){let t=await d();o=``,s=``,postMessage({type:`status`,message:`Running Python...`});let n=p(i);n.length&&(postMessage({type:`status`,message:`Loading ${n.join(`, `)}...`}),await t.loadPackage(n));let r=await t.runPythonAsync(m(i,a));if(e!==c)return;let l=JSON.parse(r),u=h(`${o}${s}`);if(l.status===`waiting_for_input`){postMessage({type:`output`,status:`waiting_for_input`,output:u,prompt:l.prompt||``});return}if(l.status===`error`){postMessage({type:`output`,status:`error`,output:u,error:l.error||`Python error`});return}postMessage({type:`output`,status:`finished`,output:u})}function p(e){let t=new Set,n=/^\s*(?:import|from)\s+([A-Za-z_][\w.]*)(?:\s+as\s+([A-Za-z_]\w*))?/gm,r;for(;r=n.exec(e);){let e=r[1].split(`.`)[0],n=u.get(e)||e;l.has(n)&&t.add(n)}return[...t]}function m(e,t){return`
import builtins
import json
import traceback

__py_ide_result = {"status": "finished", "prompt": "", "error": ""}
__py_ide_inputs = ${JSON.stringify(t)}
__py_ide_blocked_imports = {
    "cffi", "ctypes", "http.client", "js", "micropip", "pyodide",
    "requests", "socket", "subprocess", "urllib"
}
__py_ide_original_import = builtins.__import__

class __PyIdeNeedInput(BaseException):
    pass

def __py_ide_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = str(name).split(".")[0]
    if name in __py_ide_blocked_imports or root in __py_ide_blocked_imports:
        raise ImportError(f"{name} is blocked in the PythonPages browser runner")
    for blocked in __py_ide_blocked_imports:
        if str(name).startswith(blocked + "."):
            raise ImportError(f"{name} is blocked in the PythonPages browser runner")
    return __py_ide_original_import(name, globals, locals, fromlist, level)

def __py_ide_input(prompt=""):
    if not __py_ide_inputs:
        raise __PyIdeNeedInput(str(prompt))
    value = __py_ide_inputs.pop(0)
    print(str(prompt) + value)
    return value

builtins.__import__ = __py_ide_import
builtins.input = __py_ide_input

try:
    exec(compile(${JSON.stringify(e)}, "student_code.py", "exec"), globals(), globals())
except __PyIdeNeedInput as exc:
    __py_ide_result["status"] = "waiting_for_input"
    __py_ide_result["prompt"] = str(exc)
except BaseException:
    __py_ide_result["status"] = "error"
    __py_ide_result["error"] = traceback.format_exc()
    print(__py_ide_result["error"])

json.dumps(__py_ide_result)
`}function h(e){return e.length<=12e3?e:`${e.slice(0,12e3)}\n[Output stopped because it is too long.]\n`}})();