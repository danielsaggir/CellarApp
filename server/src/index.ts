import express from "express";
import cors from "cors";
import prisma from "./prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateJWT, AuthRequest } from "./middleware/auth";
<<<<<<< HEAD
=======
import { upload, uploadImageToS3 } from "./services/s3Service";
<<<<<<< HEAD
import { analyzeWineAI } from "./services/aiService";
>>>>>>> 5210e78 (access tokens)
=======
import { analyzeWineAI } from "./services/aiService"; // 👈 פונקציה פנימית שמדברת עם OpenAI
>>>>>>> eae6738 (openai service)

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// ✅ Root
=======
// ================== ROOT ==================
>>>>>>> 5210e78 (access tokens)
app.get("/", (_req, res) => {
  res.json({ message: "Cellar API 🍷 OK" });
});

<<<<<<< HEAD
// ✅ REGISTER
=======
// ================== AUTH ==================
>>>>>>> 5210e78 (access tokens)
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash: hashedPassword, name }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

<<<<<<< HEAD
// ✅ LOGIN
=======
>>>>>>> 5210e78 (access tokens)
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

<<<<<<< HEAD
// ✅ PROFILE (Protected)
=======
>>>>>>> 5210e78 (access tokens)
app.get("/auth/me", authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ id: user?.id, email: user?.email, name: user?.name, isAdmin: user?.isAdmin });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ GET /wines/my - יינות של המשתמש המחובר
app.get("/wines/my", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const wines = await prisma.wine.findMany({
      where: {
        users: {
          some: { id: req.user.id }, // רק יינות ששייכים למשתמש הנוכחי
        },
      },
    });

    res.json(wines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

<<<<<<< HEAD
// ✅ POST /wines/add - הוספת יין חדש לאוסף המשתמש
app.post("/wines/add", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { name, country, region, producer, vintage, type, imageUrl } = req.body;
=======
// ================== WINES ==================
app.post(
  "/wines/add",
  authenticateJWT,
  upload.single("image"),
  async (req: AuthRequest, res) => {
    try {
      const { name, country, region, producer, vintage, type } = req.body;

      if (!name || !country || !vintage || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
>>>>>>> 5210e78 (access tokens)

      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = await uploadImageToS3(req.file);
      }

      const wine = await prisma.wine.create({
        data: {
          name,
          country,
          region,
          producer,
          vintage: Number(vintage),
          type,
          imageUrl: imageUrl || null,
          users: { connect: { id: req.user!.id } },
        },
      });

      res.json(wine);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add wine" });
    }
<<<<<<< HEAD

    // יצירת יין חדש ושיוכו למשתמש המחובר
    const wine = await prisma.wine.create({
      data: {
        name,
        country,
        region,
        producer,
        vintage: Number(vintage),
        type,
        imageUrl,
        users: {
          connect: { id: req.user.id }, // ✅ שיוך ל־user הנוכחי
        },
      },
    });

    res.json(wine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
=======
>>>>>>> 5210e78 (access tokens)
  }
);

<<<<<<< HEAD

=======
app.get("/wines/my", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const wines = await prisma.wine.findMany({
      where: { users: { some: { id: req.user!.id } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(wines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wines" });
  }
});

// ================== AI ANALYSIS ==================
// 👇 העברתי ל-POST כדי לאפשר שליחה גמישה (פחות מגבלות URL)
app.post("/wines/analyze", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { wineId } = req.body;

    const wine = await prisma.wine.findUnique({ where: { id: wineId } });
    if (!wine) return res.status(404).json({ error: "Wine not found" });

    const analysis = await analyzeWineAI(wine);
    res.json({ analysis });
  } catch (err) {
    console.error("AI request failed:", err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
>>>>>>> 5210e78 (access tokens)
