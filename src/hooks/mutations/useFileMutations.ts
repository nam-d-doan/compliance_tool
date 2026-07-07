import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileService } from "@/services";
import { fileKeys, capKeys } from "@/hooks/query-keys";

/** Upload a single file attachment. Invalidates file lists and the linked CAP. */
export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      capId,
      uploadedBy,
      uploadedById,
    }: {
      file: File;
      capId?: string;
      uploadedBy?: string;
      uploadedById?: string;
    }) => FileService.upload(file, { capId, uploadedBy, uploadedById }),
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
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FileService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      // CAP detail may carry fileIds referencing the deleted file.
      queryClient.invalidateQueries({ queryKey: capKeys.all });
    },
  });
}
