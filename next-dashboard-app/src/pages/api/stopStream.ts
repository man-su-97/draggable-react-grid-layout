import type { NextApiRequest, NextApiResponse } from "next";
import { deletePathConfig } from "@/lib/mediamtxClient.server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: "path required" });
      }

      await deletePathConfig(path);
      return res.status(200).json({ success: true });
    } catch (err: unknown) {
      return res.status(500).json({
        error: (err as Error).message ?? "Failed to stop stream",
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
