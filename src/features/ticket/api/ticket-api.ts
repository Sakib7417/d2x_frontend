import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { Ticket, CreateTicketPayload, ReplyTicketPayload } from "@/types/models";

export interface TicketParams {
  page?: number;
  limit?: number;
  status?: "OPEN" | "REPLIED" | "CLOSED";
}

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===== User =====

    myTickets: builder.query<Paginated<Ticket>, TicketParams | void>({
      query: (params) => ({
        url: bff("/tickets"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<Ticket>(response),
      providesTags: (result) => listTags("Ticket", result?.items),
    }),

    myTicket: builder.query<Ticket, UUID>({
      query: (id) => ({ url: bff(`/tickets/${id}`) }),
      transformResponse: (response: ApiSuccess<Ticket>) => response.data,
      providesTags: (result) => listTags("Ticket", result ? [result] : []),
    }),

    createTicket: builder.mutation<Ticket, CreateTicketPayload>({
      query: (body) => ({ url: bff("/tickets"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<Ticket>) => response.data,
      invalidatesTags: [listTag("Ticket")],
    }),

    replyToTicket: builder.mutation<unknown, { id: UUID; body: ReplyTicketPayload }>({
      query: ({ id, body }) => ({ url: bff(`/tickets/${id}/reply`), method: "POST", body }),
      invalidatesTags: [listTag("Ticket")],
    }),

    // ===== Admin =====

    adminTickets: builder.query<Paginated<Ticket>, TicketParams | void>({
      query: (params) => ({
        url: bff("/tickets/admin/all"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<Ticket>(response),
      providesTags: (result) => listTags("Ticket", result?.items),
    }),

    adminTicket: builder.query<Ticket, UUID>({
      query: (id) => ({ url: bff(`/tickets/admin/${id}`) }),
      transformResponse: (response: ApiSuccess<Ticket>) => response.data,
      providesTags: (result) => listTags("Ticket", result ? [result] : []),
    }),

    adminReply: builder.mutation<unknown, { id: UUID; body: ReplyTicketPayload }>({
      query: ({ id, body }) => ({ url: bff(`/tickets/admin/${id}/reply`), method: "POST", body }),
      invalidatesTags: [listTag("Ticket")],
    }),

    closeTicket: builder.mutation<unknown, UUID>({
      query: (id) => ({ url: bff(`/tickets/admin/${id}/close`), method: "PUT" }),
      invalidatesTags: [listTag("Ticket")],
    }),

    reopenTicket: builder.mutation<unknown, UUID>({
      query: (id) => ({ url: bff(`/tickets/admin/${id}/reopen`), method: "PUT" }),
      invalidatesTags: [listTag("Ticket")],
    }),
  }),
  overrideExisting: false,
});

export const {
  useMyTicketsQuery,
  useMyTicketQuery,
  useCreateTicketMutation,
  useReplyToTicketMutation,
  useAdminTicketsQuery,
  useAdminTicketQuery,
  useAdminReplyMutation,
  useCloseTicketMutation,
  useReopenTicketMutation,
} = ticketApi;
