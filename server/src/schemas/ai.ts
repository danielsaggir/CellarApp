import { z } from "zod";

export const analyzeSchema = z.object({
  wineId: z.string().uuid("Invalid wine ID"),
});

export const pairingSchema = z.object({
  food: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Food is required")),
});
