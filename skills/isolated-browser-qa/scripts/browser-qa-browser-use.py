"""Private native CLI adapter; browser lifetime belongs to browser-qa-session.mjs."""
import asyncio
import contextlib
import importlib.metadata
import io
import json
import logging
import os
from pathlib import Path
import sys
import tempfile

os.environ.update(ANONYMIZED_TELEMETRY="false", BROWSER_USE_SETUP_LOGGING="false",
                  BROWSER_USE_LOGGING_LEVEL="critical", BROWSER_USE_DISABLE_EXTENSIONS="1")
logging.disable(logging.CRITICAL)
WIRE = sys.stdout
ERROR_ACTIONS = {"click", "type", "input", "switch", "close-tab", "select", "upload",
                 "hover", "dblclick", "rightclick", "get", "wait", "python"}
FIELDS = {
    "open": {"url"}, "click": {"args"}, "type": {"text"}, "input": {"index", "text"},
    "scroll": {"direction", "amount"}, "back": set(), "screenshot": {"path", "full"},
    "state": set(), "switch": {"tab"}, "close-tab": {"tab"}, "keys": {"keys"},
    "select": {"index", "value"}, "upload": {"index", "path"}, "eval": {"js"},
    "extract": {"query"}, "wait": {"wait_command", "selector", "text", "state", "timeout"},
    "hover": {"index"}, "dblclick": {"index"}, "rightclick": {"index"},
    "get": {"get_command", "index", "selector", "attribute"},
    "python": {"code", "file", "reset", "vars"},
    "cookies": {"cookies_command", "url", "name", "value", "domain", "path", "secure",
                "http_only", "same_site", "expires", "file"},
    "shutdown": set(), "qa-rejected": {"reason"},
}


class NavigationRejected(Exception):
    pass


def emit(event, **values):
    WIRE.write(json.dumps({"event": event, **values}) + "\n")
    WIRE.flush()


def native():
    # This module has command-executing import interceptors; never import with caller argv.
    previous = sys.argv
    sys.argv = ["browser-use"]
    try:
        from browser_use.skill_cli.main import build_parser, send_command
    finally:
        sys.argv = previous
    if importlib.metadata.version("browser-use") != "0.12.6":
        raise RuntimeError("BROWSER_USE_CAPABILITY_UNAVAILABLE")
    return build_parser, send_command


def failed(action, data):
    """Only native handler failure forms, never recursive business-data inspection."""
    if not isinstance(data, dict):
        return False
    if action in ERROR_ACTIONS and set(data) == {"error"}:
        return True
    if action == "python" and data.get("success") is False and "error" in data:
        return True
    if action == "extract" and set(data) == {"query", "error"}:
        return True
    if action == "cookies" and data.get("success") is False and "error" in data:
        return True
    return action == "wait" and data.get("found") is False


def render(response, as_json):
    if as_json:
        print(json.dumps(response))
    elif response.get("success"):
        data = response.get("data")
        if isinstance(data, dict):
            if "_raw_text" in data:
                print(data["_raw_text"])
            else:
                for key, value in data.items():
                    if not key.startswith("_"):
                        print(f"{key}: <{len(value)} bytes>" if key == "screenshot" and len(str(value)) > 100
                              else f"{key}: {value}")
        elif data is not None:
            print(data)
    else:
        print("Error: " + str(response.get("error", "NATIVE_COMMAND_FAILED")), file=sys.stderr)
    return 0 if response.get("success") is True else 1


def cli(argv):
    build_parser, send_command = native()
    session = os.environ["BROWSER_QA_SESSION"]
    # Errors can contain caller arguments; retain the native parser, not its unsafe diagnostic.
    parsed_output = io.StringIO()
    try:
        with contextlib.redirect_stdout(parsed_output), contextlib.redirect_stderr(io.StringIO()):
            args = build_parser().parse_args(argv)
    except SystemExit as e:
        if e.code == 0:
            print(parsed_output.getvalue(), end="")
            return 0
        try:
            send_command("qa-rejected", {"reason": "NATIVE_ARGUMENTS_INVALID", "_qa_session": session,
                                         "_qa_cwd": os.getcwd()}, session=session)
        except Exception:
            pass
        print("NATIVE_ARGUMENTS_INVALID", file=sys.stderr)
        return 1
    action = args.command
    requested = args.session or os.environ.get("BROWSER_USE_SESSION", session)
    forbidden = (requested != session or action not in (set(FIELDS) | {"close"}) or
                 action == "qa-rejected" or getattr(args, "profile", None) is not None or
                 getattr(args, "cdp_url", None) is not None or getattr(args, "connect", False) or
                 getattr(args, "headed", False) or getattr(args, "all", False) or
                 getattr(args, "mcp", False) or getattr(args, "template", None) is not None)
    cwd = os.getcwd()
    params = {key: value for key, value in vars(args).items()
              if key not in {"command", "headed", "json", "cdp_url", "session", "connect", "mcp", "template"}
              and value is not None}
    if forbidden:
        action, params = "qa-rejected", {"reason": "NATIVE_SESSION_OR_COMMAND_REJECTED"}
    if action == "close":
        action, params = "shutdown", {}
    if action == "upload" and "path" in params:
        params["path"] = str(Path(params["path"]).expanduser().resolve())
    params.update(_qa_session=session, _qa_cwd=cwd)
    # No main(), ensure_daemon(), migration, global close or subprocess auto-start.
    try:
        response = send_command(action, params, session=session)
    except Exception:
        response = {"success": False, "error": "NATIVE_SESSION_UNAVAILABLE"}
    return render(response, args.json)


async def adapter(session, root, profile_path):
    native()
    # Import-time DEFAULT_BROWSER_PROFILE creates a downloads directory. Scope only
    # that initialization to our root; restore tempfile's public setting before any
    # caller code runs. The caller's HOME/TMPDIR and later tempfile semantics stay intact.
    import_temp = root / 'sdk-import'
    import_temp.mkdir()
    previous_tempdir = tempfile.tempdir
    tempfile.tempdir = str(import_temp)
    try:
        from browser_use import BrowserProfile, BrowserSession
        from browser_use.skill_cli.sessions import SessionInfo
        from browser_use.skill_cli.commands import browser, python_exec
        from browser_use.skill_cli.utils import find_chrome_executable
    finally:
        tempfile.tempdir = previous_tempdir

    executable = os.environ.get("BROWSER_QA_BROWSER_EXECUTABLE") or find_chrome_executable()
    if not executable or not os.access(executable, os.X_OK):
        raise RuntimeError("BROWSER_USE_BROWSER_UNAVAILABLE")
    if len(os.fsencode(str(root / (session + '.sock')))) >= 100:
        raise RuntimeError("NATIVE_SOCKET_PATH_TOO_LONG")
    profile = BrowserProfile(user_data_dir=profile_path, downloads_path=root / 'downloads', headless=True,
                             allowed_domains=os.environ["BROWSER_QA_ALLOWED_DOMAINS"].split(","),
                             storage_state=None, keep_alive=True, enable_default_extensions=False,
                             ignore_default_args=True, args=["--disable-popup-blocking"])
    loop = asyncio.get_running_loop()
    reader = asyncio.StreamReader()
    await loop.connect_read_pipe(lambda: asyncio.StreamReaderProtocol(reader), sys.stdin)
    emit("launch", executable=executable, args=profile.get_args())
    start = json.loads(await reader.readline())
    bs = BrowserSession(cdp_url=start["endpoint"], browser_profile=profile, is_local=False, use_cloud=False)
    if bs.is_local or bs.browser_profile.use_cloud:
        raise RuntimeError("NATIVE_ATTACH_REQUIRED")
    bus = bs.event_bus
    await bs.start()
    info = SessionInfo(name=session, headed=False, profile=None, cdp_url=None, browser_session=bs)
    lock = asyncio.Lock()
    approvals = {}
    active = set()
    python_active = set()
    sequence = 0
    stopping = False
    detached = False

    async def approved(response, navigation=False):
        nonlocal sequence
        sequence += 1
        token = str(sequence)
        future = loop.create_future()
        approvals[token] = future
        if navigation:
            emit("navigation", token=token, url=response)
        else:
            emit("response", token=token, response=response)
        try:
            return await future
        finally:
            approvals.pop(token, None)

    async def execute(action, params):
        async with lock:
            if stopping:
                raise RuntimeError("NATIVE_SESSION_STOPPING")
            cwd = params.pop("_qa_cwd")
            previous = os.getcwd()
            os.chdir(cwd)
            task = asyncio.current_task()
            if action == "python":
                python_active.add(task)
            try:
                if action == "python":
                    # Shield the whole task at its caller: a disconnected client cannot restore cwd
                    # before the real executor thread has finished.
                    return await python_exec.handle(info, params)
                # The pinned native open handler awaits dispatch but omits its
                # failure result. Consume only this command's newly dispatched
                # matching navigation; historical/background events do not belong
                # to the caller. event_history is a public field of pinned Bubus.
                if action == "open":
                    requested_url = params["url"]
                    if not requested_url.startswith(("http://", "https://", "file://")):
                        requested_url = "https://" + requested_url
                    verdict = await approved(requested_url, navigation=True)
                    if stopping or verdict == "cancelled":
                        raise RuntimeError("NATIVE_SESSION_STOPPING")
                    if verdict is not True:
                        raise NavigationRejected()
                before = set(bus.event_history) if action == "open" else set()
                data = await browser.handle(action, info, params)
                if action == "open":
                    from browser_use.browser.events import NavigateToUrlEvent
                    requested_url = params["url"]
                    if not requested_url.startswith(("http://", "https://", "file://")):
                        requested_url = "https://" + requested_url
                    for key, event in list(bus.event_history.items()):
                        if (key not in before and isinstance(event, NavigateToUrlEvent)
                                and event.url == requested_url):
                            await event.event_result(raise_if_any=True, raise_if_none=False)
                return data
            finally:
                python_active.discard(task)
                os.chdir(previous)

    async def connection(client_reader, writer):
        response = {"id": "", "success": False, "error": "NATIVE_REQUEST_INVALID"}
        try:
            request = json.loads(await asyncio.wait_for(client_reader.readline(), 60))
            request_id, action, params = request.get("id", ""), request.get("action"), request.get("params")
            response["id"] = request_id
            if not isinstance(request_id, str) or not isinstance(action, str) or action not in FIELDS or not isinstance(params, dict):
                raise ValueError()
            if params.pop("_qa_session", None) != session:
                raise ValueError()
            cwd = params.get("_qa_cwd")
            if not isinstance(cwd, str) or not os.path.isabs(cwd) or not os.path.isdir(cwd):
                raise ValueError()
            if set(params) - (FIELDS[action] | {"_qa_cwd"}):
                raise ValueError()
            if stopping:
                response["error"] = "NATIVE_SESSION_STOPPING"
            elif action == "qa-rejected":
                response["error"] = "NATIVE_SESSION_OR_COMMAND_REJECTED"
            elif action == "shutdown":
                response = {"id": request_id, "success": True, "data": {"shutdown": True}}
                emit("shutdown")
            elif action == "cookies" and os.environ.get("BROWSER_QA_AUTH_MODE") == "read-only-ticket-export":
                response["error"] = "TICKET_COOKIE_COMMAND_FORBIDDEN"
            else:
                task = asyncio.create_task(execute(action, dict(params)))
                active.add(task)
                task.add_done_callback(active.discard)
                data = await asyncio.shield(task)
                response = ({"id": request_id, "success": False, "error": "NATIVE_COMMAND_FAILED"}
                            if failed(action, data) else {"id": request_id, "success": True, "data": data})
        except NavigationRejected:
            response["error"] = "TARGET_OUTSIDE_ALLOWED_DOMAINS"
        except Exception:
            response["error"] = "NATIVE_COMMAND_FAILED"
        try:
            response = await approved(response)
            writer.write((json.dumps(response) + "\n").encode())
            await writer.drain()
        except (ConnectionError, BrokenPipeError):
            pass
        finally:
            writer.close()

    socket_path = root / (session + ".sock")
    server = await asyncio.start_unix_server(connection, path=socket_path)
    os.chmod(socket_path, 0o600)
    (root / (session + ".pid")).write_text(str(os.getpid()))
    emit("ready", helper_pid=os.getpid(), bus_id=bus.id)
    while True:
        line = await reader.readline()
        if not line:
            command = {"command": "stop"}
        else:
            command = json.loads(line)
        if command.get("command") == "approve":
            future = approvals.get(command["token"])
            if future is not None and not future.done():
                future.set_result(command["response"])
        elif command.get("command") in ("detach", "stop"):
            stopping = True
            if not detached:
                await bs.reset()
                await bus.stop(timeout=1, clear=True)
                detached = True
            emit("detached")
            if command["command"] == "stop":
                server.close()
                await server.wait_closed()
                if python_active:
                    emit("executor_pending", count=len(python_active))
                    # Do not return through asyncio.run cancellation/cwd-finally while a real
                    # executor is alive. The Node owner may TERM this authenticated helper PID.
                    await asyncio.Event().wait()
                for task in active:
                    task.cancel()
                if active:
                    await asyncio.wait(active, timeout=1)
                emit("stopped")
                return


def entry():
    role = sys.argv[1]
    if role == "cli":
        return cli(sys.argv[2:])
    if role == "probe":
        native()
        from browser_use.skill_cli.utils import find_chrome_executable
        executable = os.environ.get("BROWSER_QA_BROWSER_EXECUTABLE") or find_chrome_executable()
        if not executable or not os.access(executable, os.X_OK):
            raise RuntimeError("BROWSER_USE_BROWSER_UNAVAILABLE")
        print(json.dumps({"executable": executable, "version": "0.12.6"}))
        return 0
    if role != "adapter":
        return 1
    # SDK logging and handler prints are never the anonymous protocol stream.
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        asyncio.run(adapter(sys.argv[2], Path(sys.argv[3]), Path(sys.argv[4])))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(entry())
    except Exception as error:
        code = str(error) if str(error) in {"BROWSER_USE_BROWSER_UNAVAILABLE"} else "BROWSER_USE_CAPABILITY_UNAVAILABLE"
        emit("failure", error=code)
        raise SystemExit(1)
