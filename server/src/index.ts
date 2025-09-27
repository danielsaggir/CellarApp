import express from "express";
import cors from "cors";
import "dotenv/config";
import prisma from "./prisma";
import { upload, uploadImageToS3 } from "./services/s3Service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateJWT, AuthRequest } from "./middleware/auth";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// OpenAI init
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Test route
app.get("/", (_req, res) => {
  res.json({ message: "Wine Cellar — API OK 🍷" });
});

// ================== AUTH ==================

// REGISTER
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashedPassword },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// ME
app.get("/auth/me", authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) return res.sendStatus(401);
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  res.json(user);
});

// ================== WINES ==================

// Upload image + create wine
app.post("/wines", authenticateJWT, upload.single("image"), async (req: AuthRequest, res) => {
  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }
    const { name, country, region, producer, vintage, type } = req.body;
    const wine = await prisma.wine.create({
      data: {
        name,
        country,
        region,
        producer,
        vintage: parseInt(vintage, 10),
        type,
        imageUrl,
        users: { connect: { id: req.user!.userId } },
      },
    });
    res.json(wine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create wine" });
  }
});

// List wines
app.get("/wines", async (_req, res) => {
  const wines = await prisma.wine.findMany();
  res.json(wines);
});

// Delete wine (admin only)
app.delete("/wines/:id", authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  try {
    await prisma.wine.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Wine not found" });
  }
});

// ================== OPENAI ==================
app.post("/ai/pairing", async (req, res) => {
  try {
    const { food } = req.body;
    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: `Suggest a wine pairing for: ${food}`,
      store: true,
    });
    res.json({ suggestion: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
