import { Router } from "express";
import prisma from "../prisma";
import { upload, uploadImageToS3 } from "../services/s3Service";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { aiAnalyzeWine } from "../services/aiService";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  upload.single("image"),
  async (req: AuthRequest, res) => {
    try {
      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = await uploadImageToS3(req.file);
      }

      const { name, country, region, producer, vintage, type, notes } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Wine name is required" });
      }
      if (!country || country.trim() === "") {
        return res.status(400).json({ error: "Country is required" });
      }
      if (!type) {
        return res.status(400).json({ error: "Wine type is required" });
      }

      const allowedTypes = ["RED", "WHITE", "ROSE", "SPARKLING", "ORANGE"];
      const cleanType = String(type).toUpperCase();
      if (!allowedTypes.includes(cleanType)) {
        return res.status(400).json({
          error: `Invalid wine type. Allowed types: ${allowedTypes.join(", ")}`,
        });
      }

      let vintageNumber: number | null = null;
      if (vintage) {
        vintageNumber = parseInt(vintage, 10);
        if (isNaN(vintageNumber)) {
          return res.status(400).json({ error: "Vintage must be a valid number" });
        }
      }

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
      }

      res.json(finalWine);
    } catch (err: any) {
      console.error("Wine creation error:", err);
      res.status(500).json({ error: err.message || "Failed to create wine" });
    }
  }
);

router.get("/", async (_req, res) => {
  const wines = await prisma.wine.findMany({ orderBy: { createdAt: "desc" } });
  res.json(wines);
});

router.get("/my", authenticateJWT, async (req: AuthRequest, res) => {
  const wines = await prisma.wine.findMany({
    where: { users: { some: { id: req.user!.userId } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(wines);
});

router.delete("/:id", authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  try {
    await prisma.wine.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Wine not found" });
  }
});

export default router;
