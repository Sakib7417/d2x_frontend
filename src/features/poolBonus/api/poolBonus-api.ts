import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { MONEY_MOVEMENT_TAGS, listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type {
  PoolBonusRequest,
  CreatePoolBonusRequestPayload,
  UpdatePoolBonusRequestPayload,
  RejectPoolBonusRequestPayload,
} from "@/types/models";
import type { PoolBonusRequestStatus, PoolBonusRequestType } from "@/types/enums";

export interface PoolBonusRequestParams {
  page?: number;
  limit?: number;
  status?: PoolBonusRequestStatus;
  requestType?: PoolBonusRequestType;
}

export const poolBonusApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===== User endpoints =====

    createPoolBonusRequest: builder.mutation<PoolBonusRequest, CreatePoolBonusRequestPayload>({
      query: (body) => ({ url: bff("/pool-bonus/request"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      invalidatesTags: [...MONEY_MOVEMENT_TAGS, listTag("PoolBonusRequest")],
    }),

    poolBonusRequests: builder.query<Paginated<PoolBonusRequest>, PoolBonusRequestParams | void>({
      query: (params) => ({
        url: bff("/pool-bonus/requests"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<PoolBonusRequest>(response),
      providesTags: (result) => listTags("PoolBonusRequest", result?.items),
    }),

    poolBonusRequest: builder.query<PoolBonusRequest, UUID>({
      query: (id) => bff(`/pool-bonus/requests/${id}`),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      providesTags: (result) => [{ type: "PoolBonusRequest" as const, id: result?.id }],
    }),

    cancelPoolBonusRequest: builder.mutation<PoolBonusRequest, UUID>({
      query: (id) => ({ url: bff(`/pool-bonus/requests/${id}`), method: "DELETE" }),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      invalidatesTags: [...MONEY_MOVEMENT_TAGS, listTag("PoolBonusRequest")],
    }),

    // ===== Admin endpoints =====

    adminPoolBonusRequests: builder.query<Paginated<PoolBonusRequest>, PoolBonusRequestParams | void>({
      query: (params) => ({
        url: bff("/pool-bonus/admin/requests"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<PoolBonusRequest>(response),
      providesTags: (result) => listTags("PoolBonusRequest", result?.items),
    }),

    adminPoolBonusRequest: builder.query<PoolBonusRequest, UUID>({
      query: (id) => bff(`/pool-bonus/admin/requests/${id}`),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      providesTags: (result) => [{ type: "PoolBonusRequest" as const, id: result?.id }],
    }),

    approvePoolBonusRequest: builder.mutation<PoolBonusRequest, { id: UUID; adminNote?: string }>({
      query: ({ id, adminNote }) => ({
        url: bff(`/pool-bonus/admin/requests/${id}/approve`),
        method: "PUT",
        body: { adminNote },
      }),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      invalidatesTags: [...MONEY_MOVEMENT_TAGS, listTag("PoolBonusRequest")],
    }),

    updatePoolBonusRequest: builder.mutation<PoolBonusRequest, { id: UUID } & UpdatePoolBonusRequestPayload>({
      query: ({ id, ...body }) => ({
        url: bff(`/pool-bonus/admin/requests/${id}/update`),
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      invalidatesTags: [...MONEY_MOVEMENT_TAGS, listTag("PoolBonusRequest")],
    }),

    rejectPoolBonusRequest: builder.mutation<PoolBonusRequest, { id: UUID } & RejectPoolBonusRequestPayload>({
      query: ({ id, ...body }) => ({
        url: bff(`/pool-bonus/admin/requests/${id}/reject`),
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiSuccess<PoolBonusRequest>) => response.data,
      invalidatesTags: [...MONEY_MOVEMENT_TAGS, listTag("PoolBonusRequest")],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreatePoolBonusRequestMutation,
  usePoolBonusRequestsQuery,
  usePoolBonusRequestQuery,
  useCancelPoolBonusRequestMutation,
  useAdminPoolBonusRequestsQuery,
  useAdminPoolBonusRequestQuery,
  useApprovePoolBonusRequestMutation,
  useUpdatePoolBonusRequestMutation,
  useRejectPoolBonusRequestMutation,
} = poolBonusApi;
