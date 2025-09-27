export enum Protocol {
  HLS = "hls",
  WEBRTC = "webrtc",
}
export interface Reader {
  type: string;
  id: string;
}

export interface StartStreamDTO {
  rtspUrl: string;
  protocol: Protocol;
}

export interface StartStreamResponse {
  path: string;
  protocol: Protocol;
  url: string;
}

export type ServerError = { error: string };
export type AxiosServerError = import("axios").AxiosError<ServerError>;

export interface PathConfig {
  source: string;
  sourceOnDemand?: boolean;
  sourceOnDemandStartTimeout?: string;
  maxReaders?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface GlobalConfigUpdate {
  [key: string]: string | number | boolean | undefined;
}

export interface StreamItem {
  name: string;
  confName: string;
  source: {
    type: string;
    id: string;
  };
  ready: boolean;
  readyTime: string | null;
  tracks: string[];
  bytesReceived: number;
  bytesSent: number;
  readers: Reader[];
}

export interface StreamListResponse {
  itemCount: number;
  pageCount: number;
  items: StreamItem[];
}
