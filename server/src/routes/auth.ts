import { Router } from "express";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/auth";

const router = Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, isAdmin: true },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to register" });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET!,
    { expiresIn: "2h" }
  );
  res.json({ token });
});

router.get("/me", authenticateJWT, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  res.json(user);
});

export default router;
