import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);

export async function analyzeWineAI(wine: {
  name: string;
  country: string;
  region?: string | null;
  producer?: string | null;
  vintage: number | null;
  type: string;
}) {
  const prompt = `
    Analyze this wine and provide:
    - 💰 Estimated market value (in USD)
    - ⏳ Recommended drink window (years)
    - 🍷 Aging potential & tasting notes

    Wine details:
    Name: ${wine.name}
    Country: ${wine.country}
    Region: ${wine.region || "N/A"}
    Producer: ${wine.producer || "N/A"}
    Vintage: ${wine.vintage ?? "Unknown"}
    Type: ${wine.type}
  `;

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini", // 👈 מודל טקסט מהיר וזול, אפשר גם "gpt-4.1" ליותר איכות
      input: prompt,
    });

    return response.output_text || "No analysis available";
  } catch (err) {
    console.error("AI request failed:", err);
    throw new Error("AI analysis failed");
  }
}
