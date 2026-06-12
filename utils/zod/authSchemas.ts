import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
    }).trim().max(256),
    email: z.string({
      required_error: "Email is required",
    }).trim().max(256).email("Not a valid email"),
    password: z.string({
      required_error: "Password is required",
    }).trim().max(256).min(6),
    role: z.string({
      required_error: "Role is required",
    }).trim().max(256),
  }),
});

export const loginScheme = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email is required",
    }).trim().max(256).email("Not a valid email"),
    password: z.string({
      required_error: "Password is required",
    }).trim().max(256).min(6),
  }),
});

export const currentUserScheme = z.object({
  user: z.object({
    id: z.string({ required_error: "User id not provided" }).trim().max(256),
  }),
});

export const updateUserDetailsScheme = z.object({
  body: z.object({
    name: z.string().trim().max(256).optional(),
    email: z.string().trim().max(256).email().optional(),
  }),
});

export const updatePasswordScheme = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: "Current password is required",
    }).trim().max(256).min(6),
    newPassword: z.string({
      required_error: "New password is required",
    }).trim().max(256).min(6),
  }),
  req: z.object({
    user: z.object({
      id: z.string({ required_error: "No user id provided" }).trim()
    }),
  }),
});

export const forgotPasswordScheme = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email is required",
    }).trim().max(256).email("Not a valid email"),
  }),
});
