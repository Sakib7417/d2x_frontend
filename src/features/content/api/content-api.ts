import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { Post, NewsItem, CreateNewsPayload, UpdateNewsPayload } from "@/types/models";

export interface ContentParams {
  page?: number;
  limit?: number;
}

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===== Public (user) =====

    publicPosts: builder.query<Paginated<Post>, ContentParams | void>({
      query: (params) => ({
        url: bff("/content/posts"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<Post>(response),
      providesTags: (result) => listTags("Post", result?.items),
    }),

    publicNews: builder.query<Paginated<NewsItem>, ContentParams | void>({
      query: (params) => ({
        url: bff("/content/news"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<NewsItem>(response),
      providesTags: (result) => listTags("News", result?.items),
    }),

    // ===== Admin Posts =====

    adminPosts: builder.query<Paginated<Post>, ContentParams | void>({
      query: (params) => ({
        url: bff("/content/admin/posts"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<Post>(response),
      providesTags: (result) => listTags("Post", result?.items),
    }),

    createPost: builder.mutation<Post, FormData>({
      query: (body) => ({
        url: bff("/content/admin/posts"),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<Post>) => response.data,
      invalidatesTags: [listTag("Post")],
    }),

    updatePost: builder.mutation<Post, { id: UUID; body: FormData }>({
      query: ({ id, body }) => ({
        url: bff(`/content/admin/posts/${id}`),
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiSuccess<Post>) => response.data,
      invalidatesTags: [listTag("Post")],
    }),

    deletePost: builder.mutation<void, UUID>({
      query: (id) => ({ url: bff(`/content/admin/posts/${id}`), method: "DELETE" }),
      invalidatesTags: [listTag("Post")],
    }),

    // ===== Admin News =====

    adminNews: builder.query<Paginated<NewsItem>, ContentParams | void>({
      query: (params) => ({
        url: bff("/content/admin/news"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) => fromMetaEnvelope<NewsItem>(response),
      providesTags: (result) => listTags("News", result?.items),
    }),

    createNews: builder.mutation<NewsItem, CreateNewsPayload>({
      query: (body) => ({ url: bff("/content/admin/news"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<NewsItem>) => response.data,
      invalidatesTags: [listTag("News")],
    }),

    updateNews: builder.mutation<NewsItem, { id: UUID } & UpdateNewsPayload>({
      query: ({ id, ...body }) => ({ url: bff(`/content/admin/news/${id}`), method: "PUT", body }),
      transformResponse: (response: ApiSuccess<NewsItem>) => response.data,
      invalidatesTags: [listTag("News")],
    }),

    deleteNews: builder.mutation<void, UUID>({
      query: (id) => ({ url: bff(`/content/admin/news/${id}`), method: "DELETE" }),
      invalidatesTags: [listTag("News")],
    }),
  }),
  overrideExisting: false,
});

export const {
  usePublicPostsQuery,
  usePublicNewsQuery,
  useAdminPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useAdminNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} = contentApi;

/**
 * Build full image URL from a relative path returned by the API.
 * The path is proxied through the Next server via next.config.ts rewrites,
 * so the browser stays same-origin and never needs the backend's URL.
 */
export function postImageUrl(relativePath: string): string {
  if (relativePath.startsWith("http")) return relativePath;
  return relativePath; // same-origin — rewrite handles /uploads/* -> backend
}
