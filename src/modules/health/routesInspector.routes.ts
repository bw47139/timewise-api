import { Router } from "express";
import type { Express } from "express";

import { getLiveRoutes } from "../../utils/routeInspector";

/**
 * We pass the Express app into this router factory
 * so it can introspect the live routes.
 */
export function makeRoutesInspectorRouter(app: Express) {
  const router = Router();

  /**
   * GET /api/_debug/routes
   * Returns a JSON list of all registered routes
   */
  router.get("/_debug/routes", (req, res) => {
    const routes = getLiveRoutes(app);
    res.json({
      count: routes.length,
      routes,
    });
  });

  return router;
}
