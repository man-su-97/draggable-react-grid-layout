// import type { NextApiRequest, NextApiResponse } from "next";
// import { runAgent, makeId } from "@/lib/agents/runAgent";
// import { WidgetResponse } from "@/types/widgetSchemas";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<WidgetResponse | WidgetResponse[]>
// ) {
//   if (req.method !== "POST") {
//     return res.status(405).json({
//       id: makeId("error"),
//       type: "error",
//       layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
//       payload: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
//     } as WidgetResponse);
//   }

//   try {
//     const widgets = await runAgent(req.body);
//     return res.status(200).json(widgets.length === 1 ? widgets[0] : widgets);
//   } catch (err) {
//     console.error("Generate-widget API error:", err);
//     return res.status(500).json({
//       id: makeId("error"),
//       type: "error",
//       layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
//       payload: { message: (err as Error).message, code: "SERVER_ERROR" },
//     } as WidgetResponse);
//   }
// }
