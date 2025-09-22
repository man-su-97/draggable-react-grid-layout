// // Handles file uploads, likely stores them, then parsed via parseFile.


// import type { NextApiRequest, NextApiResponse } from "next";
// import { fileTypeFromBuffer } from "file-type";
// import { GoogleGenAI, File as GeminiFile } from "@google/genai";

// export const config = {
//   api: { bodyParser: false },
// };

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// async function waitForFileProcessed(fileName: string): Promise<GeminiFile> {
//   let file = await ai.files.get({ name: fileName });

//   while (file.state === "PROCESSING") {
//     console.log(`File ${fileName} still processing... retrying in 3s`);
//     await new Promise((resolve) => setTimeout(resolve, 3000));
//     file = await ai.files.get({ name: fileName });
//   }

//   if (file.state === "FAILED") {
//     throw new Error(`Gemini file processing failed: ${file.error?.message || ""}`);
//   }

//   return file;
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   try {
//     // Collect request body as buffer
//     const chunks: Buffer[] = [];
//     for await (const chunk of req) {
//       chunks.push(chunk as Buffer);
//     }
//     const fileBuffer = Buffer.concat(chunks);

//     if (!fileBuffer.length) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     // Detect MIME type
//     let mimeType = "application/octet-stream";
//     let filename = "uploaded-document";

//     const detected = await fileTypeFromBuffer(fileBuffer);
//     if (detected) {
//       mimeType = detected.mime;
//       filename = `uploaded-document.${detected.ext}`;
//     }

//     if (req.headers["x-filename"]) {
//       filename = String(req.headers["x-filename"]);
//     }

//     // Validate PDF
//     if (mimeType !== "application/pdf") {
//       return res.status(400).json({ error: "Only PDF files are supported for document analysis." });
//     }

//     // Size limit (Gemini supports up to 50MB)
//     const maxBytes = 50 * 1024 * 1024;
//     if (fileBuffer.length > maxBytes) {
//       return res.status(400).json({ error: "File too large. Max size is 50MB." });
//     }

//     // Upload to Gemini
//     const blob = new Blob([fileBuffer], { type: mimeType });
//     const uploaded = await ai.files.upload({
//       file: blob,
//       config: { displayName: filename },
//     });

//     if (!uploaded.name) {
//       throw new Error("Gemini did not return a valid file name.");
//     }

//     const fileMeta = await waitForFileProcessed(uploaded.name);
//     console.log("Gemini file ready:", fileMeta);

//     // Return DocumentPayload shape
//     return res.status(200).json({
//       fileId: fileMeta.name,       // required
//       uri: fileMeta.uri ?? "",     // required
//       filename,
//       mimeType: fileMeta.mimeType ?? mimeType,
//       insights: "Analyzing with Gemini...", // placeholder
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return res.status(500).json({ error: (err as Error).message });
//   }
// }
