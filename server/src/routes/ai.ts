import { Router } from "express";
import prisma from "../prisma";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { aiPairingForFood, aiAnalyzeWine } from "../services/aiService";

const router = Router();

router.post("/wines/analyze", authenticateJWT, async (req: AuthRequest, res) => {
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

router.post("/ai/pairing", async (req, res) => {
  try {
    const { food } = req.body;
    const suggestion = await aiPairingForFood(food);
    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
