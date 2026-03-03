import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "";

router.post("/register", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash }
  });

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return res.status(201).json({ token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token });
});

export default router;
