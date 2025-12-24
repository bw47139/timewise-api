"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const auth_service_1 = require("./auth.service");
async function register(req, res) {
    try {
        console.log("LOGIN BODY:", req.body);
        const user = await auth_service_1.authService.register(req.body);
        return res.status(201).json(user);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
async function login(req, res) {
    try {
        const result = await auth_service_1.authService.login(req.body);
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
