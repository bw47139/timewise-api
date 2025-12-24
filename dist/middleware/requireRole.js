"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(allowed) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!allowed.includes(user.role)) {
            return res.status(403).json({
                error: "Insufficient permissions",
            });
        }
        next();
    };
}
