import express from "express";
import cors from "cors";
import "dotenv/config";
console.log("CWD:", process.cwd());
console.log("ENV DEBUG:", {
  bucket: process.env.AWS_BUCKET_NAME,
  region: process.env.AWS_REGION,
  keyId: process.env.AWS_ACCESS_KEY_ID ? "✔" : "❌",
  secret: process.env.AWS_SECRET_ACCESS_KEY ? "✔" : "❌",
});

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

// Health
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
app.post(
  "/wines",
  authenticateJWT,
  upload.single("image"),
  async (req: AuthRequest, res) => {
    try {
      // Upload image if present
      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = await uploadImageToS3(req.file);
      }

      const { name, country, region, producer, vintage, type, notes } = req.body;

      // Basic validations
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Wine name is required" });
      }
      if (!country || country.trim() === "") {
        return res.status(400).json({ error: "Country is required" });
      }
      if (!type) {
        return res.status(400).json({ error: "Wine type is required" });
      }

      // Normalize type
      const allowedTypes = ["RED", "WHITE", "ROSE", "SPARKLING", "ORANGE"];
      const cleanType = String(type).toUpperCase();
      if (!allowedTypes.includes(cleanType)) {
        return res.status(400).json({
          error: `Invalid wine type. Allowed types: ${allowedTypes.join(", ")}`,
        });
      }

      // Parse vintage (optional)
      let vintageNumber: number | null = null;
      if (vintage) {
        vintageNumber = parseInt(vintage, 10);
        if (isNaN(vintageNumber)) {
          return res.status(400).json({ error: "Vintage must be a valid number" });
        }
      }

      // 1) Create wine first (drinkWindow/marketValue start as null)
      const created = await prisma.wine.create({
        data: {
          name: name.trim(),
          country: country.trim(),
          region: region?.trim() || null,
          producer: producer?.trim() || null,
          vintage: vintageNumber,
          type: cleanType as any,
          imageUrl: imageUrl || null,
          notes: notes?.trim() || null,
          drinkWindow: null,
          marketValue: null,
          users: { connect: { id: req.user!.userId } },
        },
      });

      // 2) Attempt AI enrichment immediately (non-blocking failure)
      let finalWine = created;
      try {
        if (created.vintage !== null && created.vintage !== undefined) {
          const analysis = await aiAnalyzeWine({
            name: created.name,
            country: created.country,
            region: created.region ?? null,
            producer: created.producer ?? null,
            vintage: created.vintage as number,
            type: created.type as string,
          });

          finalWine = await prisma.wine.update({
            where: { id: created.id },
            data: {
              drinkWindow: analysis.drinkWindow || null,
              marketValue: analysis.marketValue || null,
            },
          });
        }
      } catch (aiErr) {
        console.warn("AI enrichment failed on create. Keeping nulls.", aiErr);
        // Keep created record as-is if AI fails.
      }

      // 3) Return enriched (or base) wine
      res.json(finalWine);
    } catch (err: any) {
      console.error("Wine creation error:", err);
      res.status(500).json({ error: err.message || "Failed to create wine" });
    }
  }
);

// List all wines (admin/preview)
app.get("/wines", async (_req, res) => {
  const wines = await prisma.wine.findMany({ orderBy: { createdAt: "desc" } });
  res.json(wines);
});

// List current user's wines
app.get("/wines/my", authenticateJWT, async (req: AuthRequest, res) => {
  const wines = await prisma.wine.findMany({
    where: { users: { some: { id: req.user!.userId } } },
    orderBy: { createdAt: "desc" },
  });
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

// ================== AI (optional refresh endpoint) ==================
app.post("/wines/analyze", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { wineId } = req.body;
    const wine = await prisma.wine.findUnique({ where: { id: wineId } });
    if (!wine) return res.status(404).json({ error: "Wine not found" });

    if (wine.vintage === null || wine.vintage === undefined) {
      return res.status(400).json({ error: "Wine is missing a vintage year" });
    }

    const analysis = await aiAnalyzeWine({
      name: wine.name,
      country: wine.country,
      region: wine.region ?? null,
      producer: wine.producer ?? null,
      vintage: wine.vintage as number,
      type: wine.type as string,
    });

    const updatedWine = await prisma.wine.update({
      where: { id: wineId },
      data: {
        drinkWindow: analysis.drinkWindow || null,
        marketValue: analysis.marketValue || null,
      },
    });

    res.json(updatedWine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

// ================== OPENAI PAIRING ==================
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
