import express from "express";
import cors from "cors";
import "dotenv/config";
import prisma from "./prisma";
import { upload, uploadImageToS3 } from "./services/s3Service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateJWT, AuthRequest } from "./middleware/auth";
import { aiPairingForFood, aiAnalyzeWine } from "./services/aiService";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Wine Cellar — API OK 🍷" });
});

// ================== AUTH ==================
app.post("/auth/register", async (req, res) => {
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

app.post("/auth/login", async (req, res) => {
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

app.get("/auth/me", authenticateJWT, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  res.json(user);
});

// ================== WINES ==================
app.post("/wines", authenticateJWT, upload.single("image"), async (req: AuthRequest, res) => {
  try {
    let imageUrl: string | null = null;
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }

    const { name, country, region, producer, vintage, type } = req.body;

    // ✅ בדיקה לוודא שהשנה מספר תקין
    const vintageNumber = parseInt(vintage, 10);
    if (isNaN(vintageNumber)) {
      return res.status(400).json({ error: "Vintage must be a valid number" });
    }

    const cleanType = String(type || "").toUpperCase() as any;

    const wine = await prisma.wine.create({
      data: {
        name,
        country,
        region: region || null,
        producer: producer || null,
        vintage: vintageNumber,
        type: cleanType,
        imageUrl: imageUrl || null,
        users: { connect: { id: req.user!.userId } },
      },
    });

    res.json(wine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create wine" });
  }
});

app.get("/wines", async (_req, res) => {
  const wines = await prisma.wine.findMany({ orderBy: { createdAt: "desc" } });
  res.json(wines);
});

app.get("/wines/my", authenticateJWT, async (req: AuthRequest, res) => {
  const wines = await prisma.wine.findMany({
    where: { users: { some: { id: req.user!.userId } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(wines);
});

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

// ✅ ניתוח יין ע"י OpenAI
app.post("/wines/analyze", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { wineId } = req.body;
    const wine = await prisma.wine.findUnique({ where: { id: wineId } });
    if (!wine) return res.status(404).json({ error: "Wine not found" });

    // ✅ נוודא תמיד שהשדה vintage הוא מספר
    if (wine.vintage === null || wine.vintage === undefined) {
      return res.status(400).json({ error: "Wine is missing a vintage year" });
    }

    const analysis = await aiAnalyzeWine({
      ...wine,
      vintage: wine.vintage as number, // 👈 כאן TS כבר רגוע
    });

    res.json({ analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});


// ================== OPENAI ==================
app.post("/ai/pairing", async (req, res) => {
  try {
    const { food } = req.body;
    const suggestion = await aiPairingForFood(food);
    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
