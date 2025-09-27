import type { NextApiRequest, NextApiResponse } from "next";
import {
  addPathConfig,
  deletePathConfig,
  getActivePath,
} from "@/lib/mediamtxClient.server";
import { PathConfig, Protocol, StartStreamDTO, StartStreamResponse } from "@/types/mediamtx-types";


const HLS_BASE = process.env.MEDIAMTX_HLS_BASE ?? "http://localhost:8888";
const WEBRTC_BASE = process.env.MEDIAMTX_WEBRTC_BASE ?? "http://localhost:8889";
const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 10000;

async function waitForStreamReady(path: string) {
  const start = Date.now();
  let lastData = null;

  while (Date.now() - start < MAX_WAIT_MS) {
    const data = await getActivePath(path);
    lastData = data;

    if (data?.ready) {
      console.log(`Stream ${path} is ready`);
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.warn(
    `Stream ${path} not ready after ${MAX_WAIT_MS / 1000}s`,
    lastData
  );
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const body = req.body as StartStreamDTO;
      const { rtspUrl, protocol } = body;

      if (!rtspUrl) {
        return res.status(400).json({ error: "rtspUrl required" });
      }

      if (!Object.values(Protocol).includes(protocol)) {
        return res
          .status(400)
          .json({ error: "protocol must be 'hls' or 'webrtc'" });
      }

      const path = `stream_${Date.now()}`;
      const conf: PathConfig = {
        source: rtspUrl,
        sourceOnDemand: false,
      };

      await addPathConfig(path, conf);

      const isReady = await waitForStreamReady(path);
      if (!isReady) {
        await deletePathConfig(path);
        return res
          .status(504)
          .json({ error: `Stream not ready after ${MAX_WAIT_MS / 1000}s` });
      }

      const url =
        protocol === Protocol.HLS
          ? `${HLS_BASE}/${path}/index.m3u8`
          : `${WEBRTC_BASE}/${path}/whep`;

      const response: StartStreamResponse = {
        path,
        protocol,
        url,
      };

      return res.status(200).json(response);
    } catch (err: unknown) {
      return res.status(500).json({
        error: (err as Error).message ?? "Failed to start stream",
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
