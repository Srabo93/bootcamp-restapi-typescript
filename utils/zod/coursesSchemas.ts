import { z } from "zod";

export const byIdCourseScheme = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Course id is required",
      })
      .trim()
      .max(256),
  }),
});

export const addCourseScheme = z.object({
  body: z.object({
    title: z.string({ required_error: "Course Name required" }).trim().max(256),
    description: z
      .string({ required_error: "Course description required" })
      .trim()
      .max(256),
    weeks: z.number().max(20).min(1),
    tuition: z.number().max(40000).min(1000),
    minimumSkill: z
      .string({ required_error: "Minimum Skill is required" })
      .trim()
      .max(256),
    scholarshipAvailable: z.boolean(),
  }),
});

export const updateCourseScheme = z.object({
  user: z.object({
    id: z.string({ required_error: "User id required" }).trim().max(256),
  }),
  body: z
    .object({
      title: z
        .string({ required_error: "Course Name required" })
        .trim()
        .max(256)
        .optional(),
      description: z
        .string({ required_error: "Course description required" })
        .trim()
        .max(256)
        .optional(),
      weeks: z.number().max(20).min(1).optional(),
      tuition: z.number().max(40000).min(1000).optional(),
      minimumSkill: z
        .string({ required_error: "Minimum Skill is required" })
        .trim()
        .max(256)
        .optional(),
      scholarshipAvailable: z.boolean().optional(),
    })
    .optional(),
});

export const deleteCourseScheme = z.object({
  params: z.object({
    id: z.string({ required_error: "Course id required" }).trim().max(256),
  }),
});
