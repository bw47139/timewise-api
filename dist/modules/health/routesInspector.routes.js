"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRoutesInspectorRouter = makeRoutesInspectorRouter;
const express_1 = require("express");
const routeInspector_1 = require("../../utils/routeInspector");
/**
 * We pass the Express app into this router factory
 * so it can introspect the live routes.
 */
function makeRoutesInspectorRouter(app) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/_debug/routes
     * Returns a JSON list of all registered routes
     */
    router.get("/_debug/routes", (req, res) => {
        const routes = (0, routeInspector_1.getLiveRoutes)(app);
        res.json({
            count: routes.length,
            routes,
        });
    });
    return router;
}
