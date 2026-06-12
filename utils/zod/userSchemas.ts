import { z } from "zod";

export const byIdUserScheme = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "User id is required",
      })
      .trim()
      .max(256),
  }),
});

export const createUserScheme = z.object({
  body: z.object({
    name: z.string({ required_error: "User Name required" }).trim().max(256),
    email: z.string({ required_error: "User email required" }).trim().max(256),
    password: z
      .string({
        required_error: "Password is required",
      })
      .trim()
      .max(256)
      .min(6),
  }),
});

export const updateUserScheme = z.object({
  params: z.object({
    id: z.string({ required_error: "User id required" }).trim().max(256),
  }),
  body: z
    .object({
      name: z
        .string({ required_error: "User Name required" })
        .trim()
        .max(256)
        .optional(),
      email: z
        .string({ required_error: "User email required" })
        .trim()
        .max(256)
        .optional(),
      password: z
        .string({
          required_error: "Password is required",
        })
        .trim()
        .max(256)
        .min(6)
        .optional(),
    })
    .optional(),
});

export const deleteUserScheme = z.object({
  params: z.object({
    id: z.string({ required_error: "User id required" }).trim().max(256),
  }),
});
