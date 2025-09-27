import {
  AxiosServerError,
  StartStreamDTO,
  StartStreamResponse,
  StreamListResponse,
} from "@/types/mediamtx-types";
import { listPaths, startStream, stopStream } from "@/services/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePaths() {
  return useQuery<StreamListResponse>({
    queryKey: ["paths"],
    queryFn: listPaths,
  });
}

// Start a new stream
export function useStartStream() {
  const qc = useQueryClient();

  return useMutation<StartStreamResponse, AxiosServerError, StartStreamDTO>({
    mutationFn: (dto: StartStreamDTO) => startStream(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paths"] }),
    onError: (error) => {
      const errorMsg = error.response?.data.error || error.message;
      console.log("Error starting stream:", errorMsg);
      alert(errorMsg);
    },
  });
}

// Stop a stream
export function useStopStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => stopStream(path),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paths"] }),
  });
}
