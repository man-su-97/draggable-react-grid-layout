import {
  StartStreamDTO,
  StartStreamResponse,
  StreamListResponse,
} from "@/types/mediamtx-types";
import axios from "axios";

const apiClient = axios.create({
  baseURL: `/`,
});

export async function listPaths(): Promise<StreamListResponse> {
  const { data } = await apiClient.get<StreamListResponse>("/api/listPaths");
  return data;
}

export async function startStream({
  protocol,
  rtspUrl,
}: StartStreamDTO): Promise<StartStreamResponse> {
  const { data } = await apiClient.post<StartStreamResponse>(
    "/api/startStream",
    {
      protocol,
      rtspUrl,
    }
  );
  return data;
}

export async function stopStream(path: string) {
  const { data } = await apiClient.post("/api/stopStream", { path });
  return data;
}
