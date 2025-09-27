"use server";
import axios from "axios";
import { GlobalConfigUpdate, PathConfig, StreamListResponse } from "../types/mediamtx-types";

const MTX_BASE = process.env.MEDIAMTX_CONTROL_BASE ?? "http://mediamtx:9997";

const mediamtxApi = axios.create({
  baseURL: `${MTX_BASE}/v3`,
  timeout: 10_000,
  auth: {
    username: process.env.MEDIAMTX_USER ?? "admin",
    password: process.env.MEDIAMTX_PASS ?? "admin",
  },
});

// ---------------- CONFIG ----------------
export async function getGlobalConfig() {
  const { data } = await mediamtxApi.get("/config/global/get");
  return data;
}

export async function patchGlobalConfig(update: GlobalConfigUpdate) {
  const { data } = await mediamtxApi.patch("/config/global/patch", update);
  return data;
}

// ---------------- PATH CONFIG ----------------
export async function listPathConfigs() {
  const { data } = await mediamtxApi.get("/config/paths/list");
  return data;
}

export async function getPathConfig(name: string) {
  const { data } = await mediamtxApi.get(`/config/paths/get/${name}`);
  return data;
}

// startStream → addPathConfig + wait until active.
export async function addPathConfig(name: string, conf: PathConfig) {
  const { data } = await mediamtxApi.post(`/config/paths/add/${name}`, conf);
  return data;
}

// stopStream → deletePathConfig to tear it down.
export async function deletePathConfig(name: string) {
  const { data } = await mediamtxApi.delete(`/config/paths/delete/${name}`);
  return data;
}

// ---------------- ACTIVE PATHS ----------------
export async function listActivePaths(): Promise<StreamListResponse> {
  const { data } = await mediamtxApi.get<StreamListResponse>("/paths/list");
  return data;
}

export async function getActivePath(name: string) {
  const { data } = await mediamtxApi.get(`/paths/get/${name}`);
  return data;
}
