import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function aiPairingForFood(food: string): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: `Suggest a concise wine pairing (name style & grape if possible) for this dish: ${food}. Return 1-2 sentences.`,
    store: false,
  });
  return response.output_text || "No suggestion found";
}

type Wine = {
  name: string;
  country: string;
  region: string | null;
  producer: string | null;
  vintage: number;
  type: string;
};

export async function aiAnalyzeWine(wine: Wine): Promise<string> {
  const desc = `${wine.name} (${wine.vintage}) - ${wine.type}. ${wine.producer ?? ""} ${wine.region ? wine.region + ", " : ""}${wine.country}`;
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input:
      `Give a short, friendly 2-3 sentence description for this wine (style, typical notes, food pairing): ${desc}. No fluff.`,
    store: false,
  });
  return response.output_text || "No analysis available";
}
