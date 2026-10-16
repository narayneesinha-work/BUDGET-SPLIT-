import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Health check and environment capability detection
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

interface ClassifyRequestBody {
  keywords: string[];
  brandName: string;
  brandVariants?: string[];
  competitors?: string[];
  exclusions?: string[];
  provider?: "gemini" | "openai" | "anthropic";
  model?: string;
  apiKey?: string;
}

// Prompt construction helper
function buildClassificationPrompt(
  keywords: string[],
  brandName: string,
  brandVariants: string[] = [],
  competitors: string[] = [],
  exclusions: string[] = []
): string {
  return `You are a world-class Google Ads search specialist and semantic taxonomist.
Your task is to classify search query keywords into search campaign segments and cluster them into 4 to 6 mutually exclusive, readable themes per classification bucket.

Input Details:
- Brand Name: "${brandName}"
- Brand Variants & Misspellings: ${JSON.stringify(brandVariants)}
- Known Competitor Names: ${JSON.stringify(competitors)}
- Global Exclusions / Negative terms: ${JSON.stringify(exclusions)}

Classification Rules:
1. "Brand": Searches that contain the brand name "${brandName}" or any of its specified variants/misspellings.
2. "Competitor": Searches that contain any competitor brand name from the competitor list.
3. "Irrelevant": Searches that contain terms matching the global exclusions list, or queries that indicate non-commercial / unrelated intent (e.g. jobs, wholesale, free, login, returns) or unrelated products.
4. "Generic": All remaining commercial, high-intent product/service search queries.

Clustering Rules:
- For each classification bucket ("Brand", "Generic", "Competitor"), group keywords into 4-6 distinct, readable themes (e.g. "Oversized Fit", "Vintage Graphic", "Heavyweight Cotton", "Basic Essentials", etc.).
- For "Irrelevant" keywords, assign theme "Account Exclusions" and themeDistinguisher "exclude".
- For every valid theme, provide a "themeDistinguisher": 1-2 core stem tokens unique to that theme within its bucket (e.g. "oversized", "vintage", "heavyweight") that will be used for cross-theme negative keyword sculpting.

You must return ONLY valid JSON matching this exact schema:
{
  "keywords": [
    {
      "keyword": "string (the exact original keyword string)",
      "classification": "Brand" | "Generic" | "Competitor" | "Irrelevant",
      "theme": "string (clean readable theme name, 4-6 per classification bucket)",
      "themeDistinguisher": "string (1-2 unique stem tokens for this theme)"
    }
  ]
}

Keywords to classify:
${JSON.stringify(keywords, null, 2)}
`;
}

// API endpoint for LLM semantic classification
app.post("/api/classify", async (req, res) => {
  try {
    const body: ClassifyRequestBody = req.body;
    const {
      keywords,
      brandName,
      brandVariants = [],
      competitors = [],
      exclusions = [],
      provider = "gemini",
      model,
      apiKey,
    } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: "No keywords provided for classification." });
    }

    if (!brandName || typeof brandName !== "string") {
      return res.status(400).json({ error: "Brand name is required." });
    }

    const prompt = buildClassificationPrompt(
      keywords,
      brandName,
      brandVariants,
      competitors,
      exclusions
    );

    // 1. GEMINI PROVIDER
    if (provider === "gemini") {
      const activeKey = apiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          error: "No Gemini API key provided. Please provide an API key in LLM Settings or configure GEMINI_API_KEY.",
        });
      }

      const candidateModels = [model || "gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let lastError: any = null;
      for (const currentModel of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          });

          const rawText = response.text || "{}";
          const cleanedText = rawText.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          return res.json(parsed);
        } catch (mErr: any) {
          console.warn(`Gemini model ${currentModel} failed:`, mErr?.message || mErr);
          lastError = mErr;
          // continue to next model in candidateModels
        }
      }

      throw lastError || new Error("All Gemini model candidates failed to respond.");
    }

    // 2. OPENAI PROVIDER
    if (provider === "openai") {
      if (!apiKey) {
        return res.status(400).json({ error: "OpenAI API key is required." });
      }

      const selectedModel = model || "gpt-4o-mini";
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an expert Google Ads keyword classification system. Respond strictly with valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!openAiRes.ok) {
        const errorText = await openAiRes.text();
        return res.status(openAiRes.status).json({
          error: `OpenAI API returned error: ${openAiRes.status} ${errorText}`,
        });
      }

      const openAiData = await openAiRes.json();
      const content = openAiData.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      return res.json(parsed);
    }

    // 3. ANTHROPIC CLAUDE PROVIDER
    if (provider === "anthropic") {
      if (!apiKey) {
        return res.status(400).json({ error: "Anthropic API key is required." });
      }

      const selectedModel = model || "claude-3-5-sonnet-20241022";
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: `${prompt}\nIMPORTANT: Respond with pure JSON only, without any markdown formatting or commentary.`,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!anthropicRes.ok) {
        const errorText = await anthropicRes.text();
        return res.status(anthropicRes.status).json({
          error: `Anthropic API returned error: ${anthropicRes.status} ${errorText}`,
        });
      }

      const anthropicData = await anthropicRes.json();
      const rawText = anthropicData.content?.[0]?.text || "{}";
      // Clean potential markdown wrap
      const cleanedText = rawText.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (err: any) {
    console.error("Classification error in /api/classify:", err);
    return res.status(500).json({
      error: err.message || "Failed to process keyword classification.",
      details: err.stack,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
