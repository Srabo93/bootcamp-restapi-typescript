import { z } from "zod";

export const byIdReviewScheme = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Review id is required",
      })
      .trim()
      .max(256),
  }),
});

export const addReviewScheme = z.object({
  body: z.object({
    title: z.string({ required_error: "Review Name required" }).trim().max(256),
    text: z.string({ required_error: "Review text required" }).trim().max(256),
    rating: z.number().max(10).min(1),
  }),
});

export const updateReviewScheme = z.object({
  user: z.object({
    id: z.string({ required_error: "User id required" }).trim().max(256),
  }),
  body: z
    .object({
      title: z.string().trim().max(256).optional(),
      text: z.string().trim().max(256).optional(),
      rating: z.number().max(10).min(1).optional(),
    })
    .optional(),
});

export const deleteReviewScheme = z.object({
  params: z.object({
    id: z.string({ required_error: "Review id required" }).trim().max(256),
  }),
});
