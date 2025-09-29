import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ================== FOOD PAIRING ==================
export async function aiPairingForFood(food: string): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: `Suggest a concise wine pairing (name style & grape if possible) for this dish: ${food}. Return 1-2 sentences.`,
    store: false,
  });
  return response.output_text || "No suggestion found";
}

// ================== WINE ENRICHMENT (Drink Window + Market Value only) ==================
type Wine = {
  name: string;
  country: string;
  region: string | null;
  producer: string | null;
  vintage?: number;
  type: string;
};

type WineEnrichment = {
  drinkWindow: string | null;
  marketValue: string | null;
};

export async function aiAnalyzeWine(wine: Wine): Promise<WineEnrichment> {
  const desc = `${wine.name} (${wine.vintage ?? "N/A"}) - ${wine.type}.
  ${wine.producer ?? ""} ${wine.region ? wine.region + ", " : ""}${wine.country}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `
You are a professional wine market and aging advisor.
Given the wine details, return a JSON object with:

- drinkWindow: recommended drink window (e.g., "2015-2022")
- marketValue: approximate current market value in USD (string with $)

Wine details:
${desc}
        `,
      },
    ],
    response_format: { type: "json_object" },
  });

  let data: any;
  try {
    data = JSON.parse(response.choices[0].message.content || "{}");
  } catch {
    data = {};
  }

  return {
    drinkWindow: data.drinkWindow || null,
    marketValue: data.marketValue || null,
  };
}
