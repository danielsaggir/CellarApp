import { z } from "zod";

export const wineBodySchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Wine name is required")),
  country: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Country is required")),
  type: z
    .string()
    .transform((s) => s.toUpperCase())
    .pipe(z.enum(["RED", "WHITE", "ROSE", "SPARKLING", "ORANGE"], {
      errorMap: () => ({ message: "Invalid wine type" }),
    })),
  region: z.string().optional(),
  producer: z.string().optional(),
  vintage: z
    .union([z.literal(""), z.coerce.number().int().min(1800).max(2100)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  notes: z.string().optional(),
});
