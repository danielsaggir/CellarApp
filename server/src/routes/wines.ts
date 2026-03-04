import { Router } from "express";
import prisma from "../prisma";
import { upload, uploadImageToS3 } from "../services/s3Service";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { wineBodySchema } from "../schemas/wine";
import { aiAnalyzeWine } from "../services/aiService";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  upload.single("image"),
  validate(wineBodySchema),
  async (req: AuthRequest, res) => {
    try {
      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = await uploadImageToS3(req.file);
      }

      const { name, country, region, producer, vintage, type, notes } = req.body;

      const created = await prisma.wine.create({
        data: {
          name,
          country,
          region: region?.trim() || null,
          producer: producer?.trim() || null,
          vintage: vintage ?? null,
          type: type as any,
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

router.put(
  "/:id",
  authenticateJWT,
  upload.single("image"),
  validate(wineBodySchema),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const existing = await prisma.wine.findFirst({
        where: { id, users: { some: { id: req.user!.userId } } },
      });
      if (!existing) {
        return res.status(404).json({ error: "Wine not found or not yours" });
      }

      let imageUrl: string | null = existing.imageUrl;
      if (req.file) {
        imageUrl = await uploadImageToS3(req.file);
      }

      const { name, country, region, producer, vintage, type, notes } = req.body;

      let updated = await prisma.wine.update({
        where: { id },
        data: {
          name,
          country,
          region: region?.trim() || null,
          producer: producer?.trim() || null,
          vintage: vintage ?? null,
          type: type as any,
          imageUrl,
          notes: notes?.trim() || null,
        },
      });

      try {
        if (updated.vintage !== null && updated.vintage !== undefined) {
          const analysis = await aiAnalyzeWine({
            name: updated.name,
            country: updated.country,
            region: updated.region ?? null,
            producer: updated.producer ?? null,
            vintage: updated.vintage as number,
            type: updated.type as string,
          });

          updated = await prisma.wine.update({
            where: { id },
            data: {
              drinkWindow: analysis.drinkWindow || null,
              marketValue: analysis.marketValue || null,
            },
          });
        }
      } catch (aiErr) {
        console.warn("AI enrichment failed on update. Keeping previous values.", aiErr);
      }

      res.json(updated);
    } catch (err: any) {
      console.error("Wine update error:", err);
      res.status(500).json({ error: err.message || "Failed to update wine" });
    }
  }
);

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
