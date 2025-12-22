import { Request, Response } from "express";

import { authService } from "./auth.service";

export async function register(req: Request, res: Response) {
  try {
     console.log("LOGIN BODY:", req.body);
     
    const user = await authService.register(req.body);
    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await authService.login(req.body);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}
