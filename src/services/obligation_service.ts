import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  BulkCreateObligationsInput,
  BulkCreateObligationsResult,
} from "@/types";

export const ObligationService = {
  bulkCreate(data: BulkCreateObligationsInput) {
    return apiPost<BulkCreateObligationsResult>(
      API_ENDPOINTS.OBLIGATION_BULK,
      data,
    );
  },
};
