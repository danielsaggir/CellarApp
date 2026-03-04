import { z } from "zod";

export const analyzeSchema = z.object({
  wineId: z.string().uuid("Invalid wine ID"),
});

export const previewInsightsSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  type: z.string().min(1),
  region: z.string().optional(),
  winery: z.string().optional(),
  vintage: z.coerce.number().int().optional(),
});

export const pairingSchema = z.object({
  food: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Food is required")),
});
