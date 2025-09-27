import type { NextApiRequest, NextApiResponse } from "next";
import { listActivePaths } from "@/lib/mediamtxClient.server";
import { StreamListResponse } from "@/types/mediamtx-types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const data: StreamListResponse = await listActivePaths();
      res.status(200).json(data);
    } catch (err: unknown) {
      res.status(500).json({
        error: (err as Error).message ?? "Failed to list paths",
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
