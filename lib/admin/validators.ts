/**
 * 管理画面 API のバリデーション
 */
import { z } from "zod";

export const organizerIdParamSchema = z.object({
  id: z.string().uuid("organizer ID must be a valid UUID"),
});

export const organizerListQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  filter: z
    .enum(["all", "free", "paid", "manual", "expiring"])
    .optional()
    .default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const grantActionBodySchema = z.object({
  grantType: z.enum(["30_days", "90_days", "unlimited"]),
  reason: z.string().max(1000).optional().default(""),
});

export const revokeActionBodySchema = z.object({
  reason: z.string().max(1000).optional().default(""),
});

export const featuredUpdateBodySchema = z.object({
  isFeatured: z.boolean(),
  featuredRank: z
    .union([z.coerce.number().int().min(1).max(9999), z.null()])
    .optional()
    .default(null),
  reason: z.string().max(1000).optional().default(""),
});

export const reasonUpdateSchema = z.object({
  reason: z.string().max(1000),
});

export const notesSchema = z.object({
  note: z.string().min(1, "メモは1文字以上必要です").max(2000),
});

export const logsQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  actionType: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type OrganizerListQuery = z.infer<typeof organizerListQuerySchema>;
export type GrantActionBody = z.infer<typeof grantActionBodySchema>;
export type RevokeActionBody = z.infer<typeof revokeActionBodySchema>;
export type ReasonUpdate = z.infer<typeof reasonUpdateSchema>;
export type NotesPayload = z.infer<typeof notesSchema>;
export type LogsQuery = z.infer<typeof logsQuerySchema>;
