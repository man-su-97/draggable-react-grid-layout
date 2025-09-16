export const getPrompt = (text: string) => `
The user said: "${text}".

Return ONLY a valid JSON object matching this schema:
{
  type: "line" | "bar" | "pie" | "image" | "video" | "map" | "weather",
  title?: string,
  data?: [{ label: string, value: number }] | [{ name: string, coordinates: [number, number], color?: string }],
  src?: string,
  location?: string,
  coordinates?: [number, number] | "current"
}

Strict rules:
- For "line", "bar", "pie":
  • Always return a "data" array with at least 3 objects shaped like {label: string, value: number}.
  • "label" should be a short category (e.g. "Q1", "Sales", "Apples").
  • "value" should be a realistic number (integer or float).

- For "image":
  • Always set "src" to a valid external image URL, e.g. "https://picsum.photos/800/600" or another free stock image.
  • Do NOT use local paths like "/images/...".

- For "video":
  • Always set "src" to a valid external MP4 video URL.
  • Example: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" or "https://player.vimeo.com/external/3191573.sd.mp4".
  • Do NOT use local paths like "/videos/...".

- For "map":
  • Always return a "data" array with at least 2 objects shaped like {name: string, coordinates: [lat: number, lng: number], color?: string}.
  • Coordinates must be valid latitude/longitude pairs (lat between -90 and 90, lng between -180 and 180).
  • Example: { "name": "Paris", "coordinates": [48.8566, 2.3522], "color": "blue" }.
  • Use different colors like "red", "green", "blue", "purple", "orange" to differentiate markers.

- For "weather":
  • If user provides a city/place name (e.g. "Delhi", "Kolkata"), always set "location" to that string.
  • If user provides explicit latitude/longitude (e.g. "28.6, 77.2"), always set "coordinates" to [lat, lon].
  • If user asks for "my current location weather", always set "coordinates" to "current".
  • Never leave both "location" and "coordinates" empty — one must be provided.
  • Do NOT generate fake weather data here — only provide location name or coordinates. Weather details will be fetched by the system.

- Never include explanations, comments, markdown, or extra text — ONLY the raw JSON object.
`;
