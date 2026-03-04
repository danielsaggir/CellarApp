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

// ================== WINE LABEL SCAN (Vision) ==================
type ScannedWine = {
  name: string | null;
  country: string | null;
  region: string | null;
  winery: string | null;
  vintage: number | null;
  type: string | null;
  grapes: string | null;
};

export async function aiScanWineLabel(imageBase64: string, mimeType: string): Promise<ScannedWine> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a wine label expert. Analyze this wine bottle label image and extract as much information as possible. Return a JSON object with these fields:
- name: the wine name
- country: country of origin
- region: wine region (e.g., Bordeaux, Napa Valley)
- winery: winery or producer name
- vintage: vintage year as a number
- type: one of RED, WHITE, ROSE, SPARKLING, ORANGE
- grapes: grape varieties (e.g., "Cabernet Sauvignon, Merlot")

Use null for any field you cannot determine from the label.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
        ],
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

  const validTypes = ["RED", "WHITE", "ROSE", "SPARKLING", "ORANGE"];
  return {
    name: data.name || null,
    country: data.country || null,
    region: data.region || null,
    winery: data.winery || null,
    vintage: data.vintage ? Number(data.vintage) : null,
    type: validTypes.includes(data.type) ? data.type : null,
    grapes: data.grapes || null,
  };
}

// ================== WINE ENRICHMENT (Drink Window + Market Value only) ==================
type Wine = {
  name: string;
  country: string;
  region: string | null;
  winery: string | null;
  vintage?: number;
  type: string;
};

type WineEnrichment = {
  drinkWindow: string | null;
  marketValue: string | null;
};

export async function aiAnalyzeWine(wine: Wine): Promise<WineEnrichment> {
  const desc = `${wine.name} (${wine.vintage ?? "N/A"}) - ${wine.type}.
  ${wine.winery ?? ""} ${wine.region ? wine.region + ", " : ""}${wine.country}`;

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
