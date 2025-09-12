import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrompt } from "@/lib/userPrompt";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;
    const userPrompt = getPrompt(text);

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const rawText =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(400).json({ error: "Invalid JSON returned from AI" });
    }

    if (
      !parsed ||
      !parsed.type ||
      !["line", "bar", "pie", "image", "video", "map"].includes(parsed.type) // ✅ added map
    ) {
      return res.status(400).json({ error: "Could not parse widget" });
    }

    // ✅ IMAGE via Hugging Face API
    if (parsed.type === "image") {
      try {
        const hfResponse = await fetch(
          "https://router.huggingface.co/together/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: parsed.title || text,
              response_format: "base64",
              model: "black-forest-labs/FLUX.1-dev",
            }),
          }
        );

        if (!hfResponse.ok) {
          throw new Error(`HF Together API error: ${hfResponse.statusText}`);
        }

        const result = await hfResponse.json();
        const base64 = result.data?.[0]?.b64_json;

        parsed.src = base64 ? `data:image/png;base64,${base64}` : null;
      } catch (err) {
        console.error("HF image generation failed:", err);
        parsed.src = null;
      }
    }

    // ✅ Video fallback
    if (parsed.type === "video") {
      parsed.src =
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
    }

    // ✅ Map validation
    if (parsed.type === "map") {
      if (!Array.isArray(parsed.data)) {
        parsed.data = [];
      }

      parsed.data = parsed.data
        .filter(
          (item: any) =>
            item &&
            typeof item.name === "string" &&
            Array.isArray(item.coordinates) &&
            item.coordinates.length === 2 &&
            typeof item.coordinates[0] === "number" &&
            typeof item.coordinates[1] === "number"
        )
        .map((item: any, i: number) => ({
          name: item.name,
          coordinates: [item.coordinates[0], item.coordinates[1]] as [number, number],
          color: item.color || ["red", "blue", "green", "purple", "orange"][i % 5],
        }));

      if (parsed.data.length === 0) {
        // fallback demo data
        parsed.data = [
          { name: "New York", coordinates: [40.7128, -74.006], color: "blue" },
          { name: "London", coordinates: [51.5072, -0.1276], color: "green" },
          { name: "Tokyo", coordinates: [35.6895, 139.6917], color: "red" },
        ];
      }
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Gemini error", err);
    res.status(500).json({ error: String((err as Error).message) });
  }
}
