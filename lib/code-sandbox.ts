/**
 * Code sandbox utilities — iframe-based JS execution with console capture.
 * Zero external deps. Uses postMessage for parent↔iframe communication.
 */

export type OutputLevel = "log" | "warn" | "error" | "result" | "info";

export interface SandboxOutput {
  level: OutputLevel;
  data: string;
}

/** Serialize any value to a displayable string */
export function parseConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg === undefined) return "undefined";
      if (arg === null) return "null";
      if (typeof arg === "string") return arg;
      if (typeof arg === "function") return "[Function]";
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

/**
 * Build HTML string for iframe srcdoc.
 * Intercepts console.log/warn/error, wraps code in try/catch,
 * posts results back to parent via postMessage.
 */
export function buildSandboxHtml(code: string): string {
  // Escape code for safe embedding in HTML
  const escapedCode = code
    .replace(/<\/script>/gi, "<\\/script>")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
(function() {
  var done = false;

  function send(level, data) {
    if (done) return;
    try {
      parent.postMessage({ type: "sandbox-output", level: level, data: String(data) }, "*");
    } catch(e) {}
  }

  // Intercept console methods
  var origLog = console.log;
  var origWarn = console.warn;
  var origError = console.error;
  var origInfo = console.info;

  console.log = function() { send("log", Array.from(arguments).map(formatArg).join(" ")); };
  console.warn = function() { send("warn", Array.from(arguments).map(formatArg).join(" ")); };
  console.error = function() { send("error", Array.from(arguments).map(formatArg).join(" ")); };
  console.info = function() { send("info", Array.from(arguments).map(formatArg).join(" ")); };

  function formatArg(arg) {
    if (arg === undefined) return "undefined";
    if (arg === null) return "null";
    if (typeof arg === "string") return arg;
    if (typeof arg === "function") return "[Function]";
    if (arg instanceof Error) return arg.name + ": " + arg.message;
    try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
  }

  // 5s timeout to kill infinite loops
  var timer = setTimeout(function() {
    done = true;
    send("error", "Execution timed out (5s limit)");
  }, 5000);

  // Catch uncaught errors
  window.onerror = function(msg, url, line, col, err) {
    send("error", msg + (line ? " (line " + line + ")" : ""));
    return true;
  };

  // Listen for execute command from parent
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "sandbox-execute") {
      try {
        // Wrap in async IIFE to support top-level await
        var fn = new Function("return (async function() {\\n" + e.data.code + "\\n})()");
        fn().then(function(result) {
          if (result !== undefined) {
            send("result", formatArg(result));
          }
        }).catch(function(err) {
          send("error", err instanceof Error ? err.name + ": " + err.message : String(err));
        }).finally(function() {
          clearTimeout(timer);
          done = true;
          send("done", "");
        });
      } catch(err) {
        clearTimeout(timer);
        done = true;
        send("error", err instanceof Error ? err.name + ": " + err.message : String(err));
        send("done", "");
      }
    }
  });

  // Signal ready
  send("ready", "");
})();
</script>
</body>
</html>`;
}

/** Check if a language is executable (JS/TS) */
export function isExecutableLanguage(lang: string): boolean {
  const execLangs = ["js", "javascript", "jsx", "ts", "typescript", "tsx"];
  return execLangs.includes(lang.toLowerCase().trim());
}

/**
 * Strip TypeScript type annotations using regex.
 * Covers ~80% of common cases. Not a full parser.
 */
export function transpileTS(code: string): string {
  let result = code;

  // Remove single-line type declarations: type Foo = ...
  result = result.replace(/^(\s*)type\s+\w+\s*(<[^>]*>)?\s*=\s*[^;]+;?\s*$/gm, "");

  // Remove interface declarations (simple blocks)
  result = result.replace(/^\s*interface\s+\w+\s*(<[^>]*>)?\s*\{[\s\S]*?\}\s*$/gm, "");

  // Remove `as Type` assertions
  result = result.replace(/\s+as\s+\w+(\[\])?(<[^>]*>)?/g, "");

  // Remove `: Type` annotations after variable names, params, return types
  // Match patterns like `: TypeName`, `: TypeName[]`, `: TypeName<K>`, `: string | number`
  result = result.replace(
    /(\w|\)|\])\s*:\s*([A-Z]\w*(\[\])?(<[^>]*>)?(\s*\|\s*[A-Z]\w*(\[\])?(<[^>]*>)?)*)(?=\s*[=,;)\]\n\r])/g,
    "$1"
  );

  // Remove generic type parameters on function calls: fn<Type>( → fn(
  result = result.replace(/(\w)\s*<[A-Z][^>]*>\s*\(/g, "$1(");

  // Remove generic type parameters on arrow functions: <T extends X> => → () =>
  result = result.replace(/<[^>]+>\s*(?=\(.*?\)\s*=>)/g, "");

  // Remove `implements X` from class declarations
  result = result.replace(/\s+implements\s+\w+(\s*,\s*\w+)*/g, "");

  return result;
}

/**
 * Prepare code for execution: transpile TS if needed, wrap in context.
 */
export function prepareCode(code: string, lang: string): string {
  let prepared = code;

  if (["ts", "typescript", "tsx"].includes(lang.toLowerCase().trim())) {
    prepared = transpileTS(prepared);
  }

  return prepared;
}
