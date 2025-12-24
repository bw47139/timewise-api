"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditContext = auditContext;
function auditContext(req, _res, next) {
    req.audit = {
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
    };
    // If auth middleware already ran
    if (req.user) {
        req.audit.userId = req.user.id;
        req.audit.userEmail = req.user.email;
    }
    next();
}
