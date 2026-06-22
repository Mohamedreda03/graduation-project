import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types";

export interface ConnectionLog {
  _id: string;
  macAddress: string;
  ipAddress?: string;
  hall: {
    _id: string;
    name: string;
  } | string;
  eventType: "device-connected" | "device-disconnected";
  timestamp: string;
  processed: boolean;
  processingResult?: string;
  student?: {
    _id: string;
    studentId: string;
    name: {
      first: string;
      last: string;
    } | string;
  };
  createdAt: string;
  updatedAt: string;
}

export const connectionsService = {
  getAll: async (params?: {
    eventType?: string;
    macAddress?: string;
    hallId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ConnectionLog>> => {
    const response = await api.get<PaginatedResponse<ConnectionLog>>("/connections", {
      params,
    });
    return response.data;
  },
};
