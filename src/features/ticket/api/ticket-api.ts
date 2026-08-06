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
      query: (body) => ({
        url: bff("/tickets"),
        method: "POST",
        body: buildTicketFormData(body),
      }),
      transformResponse: (response: ApiSuccess<Ticket>) => response.data,
      invalidatesTags: [listTag("Ticket")],
    }),

    replyToTicket: builder.mutation<unknown, { id: UUID; body: ReplyTicketPayload }>({
      query: ({ id, body }) => ({
        url: bff(`/tickets/${id}/reply`),
        method: "POST",
        body: buildTicketFormData(body),
      }),
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
      query: ({ id, body }) => ({
        url: bff(`/tickets/admin/${id}/reply`),
        method: "POST",
        body: buildTicketFormData(body),
      }),
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

/**
 * Build a `FormData` payload for ticket create/reply.
 *
 * The backend always expects `multipart/form-data` on these routes (multer
 * runs before the validator). Text fields are appended as strings; each file
 * in `attachments` is appended under the `attachments` field name, which
 * multer reads as `upload.array('attachments')`. When no files are present
 * we still send FormData — the backend handles the empty files array fine.
 */
function buildTicketFormData(
  body: CreateTicketPayload | ReplyTicketPayload,
): FormData {
  const form = new FormData();
  if ("subject" in body && body.subject !== undefined) form.set("subject", body.subject);
  if ("priority" in body && body.priority !== undefined) form.set("priority", body.priority);
  form.set("message", body.message);

  const files = body.attachments ?? [];
  for (const file of files) {
    form.append("attachments", file);
  }

  return form;
}
