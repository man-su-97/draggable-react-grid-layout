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
    console.log(userPrompt);

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
      !["line", "bar", "pie", "image", "video"].includes(parsed.type)
    ) {
      return res.status(400).json({ error: "Could not parse widget" });
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Gemini error", err);
    res.status(500).json({ error: String((err as Error).message) });
  }
}
