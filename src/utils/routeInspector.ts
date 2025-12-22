import type { Express, Router } from "express";

/**
 * A single discovered route entry (flattened + human-readable)
 */
export type DiscoveredRoute = {
  method: string;
  path: string;
};

/**
 * Internal: safely join URL parts without breaking slashes
 */
function joinPaths(a: string, b: string) {
  const left = (a || "").endsWith("/") ? (a || "").slice(0, -1) : (a || "");
  const right = (b || "").startsWith("/") ? (b || "").slice(1) : (b || "");
  const out = `${left}/${right}`.replace(/\/+/g, "/");
  return out === "" ? "/" : out;
}

/**
 * Internal: express stores mounted router paths as regex sometimes.
 * We try to recover the original mount path when possible.
 */
function layerPathToString(layer: any): string {
  // If it's a direct string path (rare)
  if (typeof layer?.path === "string") return layer.path;

  // Express uses regexp for mounted paths, e.g. /^\/api\/?$/i
  const re = layer?.regexp;
  if (!re) return "";

  const src = re.source;

  // Common patterns:
  // ^\\/api\\/?$  -> /api
  // ^\\/(?:api)\\/?$ -> /api (harder)
  // We keep it simple and handle the most common clean case:
  const m = src.match(/^\^\\\/(.+?)\\\/\?\$\/*$/); // ^\/api\/?$ -> api
  if (m?.[1]) return `/${m[1].replace(/\\\//g, "/")}`;

  // Fallback: empty if we can't confidently decode
  return "";
}

/**
 * Walk an Express Router stack recursively and collect routes.
 */
function collectFromStack(stack: any[], basePath: string, out: DiscoveredRoute[]) {
  for (const layer of stack) {
    if (!layer) continue;

    // Case 1: Direct route layer
    if (layer.route && layer.route.path) {
      const routePath = layer.route.path; // string | string[]
      const paths = Array.isArray(routePath) ? routePath : [routePath];

      const methodsObj = layer.route.methods || {};
      const methods = Object.keys(methodsObj)
        .filter((k) => methodsObj[k])
        .map((k) => k.toUpperCase());

      for (const p of paths) {
        for (const method of methods) {
          out.push({
            method,
            path: joinPaths(basePath, String(p)),
          });
        }
      }
      continue;
    }

    // Case 2: Mounted router layer
    // Express puts nested routers under layer.handle.stack
    const handle = layer.handle as Router & { stack?: any[] };
    if (handle && Array.isArray((handle as any).stack)) {
      const mount = layerPathToString(layer); // best-effort
      const nextBase = mount ? joinPaths(basePath, mount) : basePath;
      collectFromStack((handle as any).stack, nextBase, out);
    }
  }
}

/**
 * Returns a sorted, deduped list of routes currently registered on the app.
 */
export function getLiveRoutes(app: Express): DiscoveredRoute[] {
  const anyApp = app as any;

  const stack: any[] = anyApp?._router?.stack;
  if (!Array.isArray(stack)) return [];

  const out: DiscoveredRoute[] = [];
  collectFromStack(stack, "", out);

  // Dedupe + sort
  const key = (r: DiscoveredRoute) => `${r.method} ${r.path}`;
  const map = new Map<string, DiscoveredRoute>();
  for (const r of out) map.set(key(r), r);

  return Array.from(map.values()).sort((a, b) => {
    if (a.path === b.path) return a.method.localeCompare(b.method);
    return a.path.localeCompare(b.path);
  });
}

/**
 * Pretty console output for startup logs.
 */
export function printLiveRoutes(app: Express, title = "ROUTES") {
  const routes = getLiveRoutes(app);
  console.log(`\n📌 ${title} (${routes.length})`);
  for (const r of routes) {
    console.log(`   ${r.method.padEnd(6)} ${r.path}`);
  }
  console.log("");
}
