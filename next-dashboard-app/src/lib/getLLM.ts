import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";


export function getLLM(provider: string) {
	switch (provider) {
		case "openai": {
			const key = process.env.OPENAI_API_KEY;
			if (!key) {
				console.warn("[getLLM] Missing OPENAI_API_KEY in environment");
			}

			return new ChatOpenAI({
				modelName: "gpt-4o-mini",
				temperature: 0.3,
				apiKey: key,
			});
		}

		case "claude": {
			const key = process.env.ANTHROPIC_API_KEY;
			if (!key) {
				console.warn("[getLLM] Missing ANTHROPIC_API_KEY in environment");
			}

			return new ChatAnthropic({
				model: "claude-3-5-sonnet-20240620",
				temperature: 0.3,
				apiKey: key,
			});
		}

		case "gemini":
		default: {
			// Gemini model fallback logic
			const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
			const model = process.env.GOOGLE_GEMINI_MODEL || "gemini-2.5-flash"; 

			if (!key) {
				console.warn(
					"[getLLM] Missing GOOGLE_API_KEY or GEMINI_API_KEY in environment"
				);
			}

			// Prevent accidental use of outdated models
			if (model.includes("1.5")) {
				console.warn(
					`[getLLM] Model "${model}" may be deprecated. Consider upgrading to "gemini-2.0-flash" or "gemini-2.5-flash".`
				);
			}

			return new ChatGoogleGenerativeAI({
				model,
				temperature: 0.3,
				apiKey: key,
			});
		}
	}
}
