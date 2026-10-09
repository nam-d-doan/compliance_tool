import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileService } from "@/services";
import { fileKeys, capKeys, nccKeys, lmKeys } from "@/hooks/query-keys";

/** Upload a single file attachment. Invalidates file lists and the linked CAP/NCC/LM case. */
export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      capId,
      nccId,
      caseId,
      uploadedBy,
      uploadedById,
      folderPath,
    }: {
      file: File;
      capId?: string;
      nccId?: string;
      caseId?: string;
      uploadedBy?: string;
      uploadedById?: string;
      folderPath?: string;
    }) =>
      FileService.upload(file, {
        capId,
        nccId,
        caseId,
        uploadedBy,
        uploadedById,
        folderPath,
      }),
    onSuccess: (_data, variables) => {
      // Invalidate the whole files namespace so list/byCap/byIds queries all
      // refetch (the detail page fetches files by ID list).
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      if (variables.capId) {
        // The CAP carries denormalized fileIds, so its detail cache is stale.
        queryClient.invalidateQueries({
          queryKey: capKeys.detail(variables.capId),
        });
      }
      if (variables.nccId) {
        queryClient.invalidateQueries({
          queryKey: nccKeys.detail(variables.nccId),
        });
      }
      if (variables.caseId) {
        queryClient.invalidateQueries({
          queryKey: lmKeys.detail(variables.caseId),
        });
      }
    },
  });
}

export function useMoveFileToFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderPath }: { id: string; folderPath: string | null }) =>
      FileService.moveToFolder(id, folderPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      // Chuyển folder ghi CaseEvent — tab Lịch sử phải tải lại.
      queryClient.invalidateQueries({ queryKey: lmKeys.all });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FileService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      // CAP/NCC/LM detail may carry fileIds referencing the deleted file.
      queryClient.invalidateQueries({ queryKey: capKeys.all });
      queryClient.invalidateQueries({ queryKey: nccKeys.all });
      queryClient.invalidateQueries({ queryKey: lmKeys.all });
    },
  });
}
