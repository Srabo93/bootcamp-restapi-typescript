import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import CourseModel from "../models/Course";
import BootcampModel from "../models/Bootcamp";
import { authenticate, authorize } from "../middlewares/auth";

const app = new Hono();

app.get("/", async (c) => {
  const courses = await CourseModel.find({});
  return c.json({ success: true, count: courses.length, data: courses }, 200);
});

app.get(
  "/:id",
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const course = await CourseModel.findById(id).populate({
      path: "bootcamp",
      select: "name description",
    });
    if (!course) throw new HTTPException(404, { message: "Course not found" });
    return c.json({ success: true, data: course }, 200);
  }
);

app.post(
  "/",
  authenticate,
  authorize("publisher", "admin"),
  zValidator(
    "json",
    z.object({
      title: z.string().trim().min(1).max(256),
      description: z.string().trim().min(1).max(256),
      weeks: z.number().min(1).max(20),
      tuition: z.number().min(1000).max(40000),
      minimumSkill: z.enum(["beginner", "intermediate", "advanced"]),
      scholarshipAvailable: z.boolean(),
      bootcamp: z.string().trim().max(256),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");
    const bootcamp = await BootcampModel.findById(body.bootcamp);
    if (!bootcamp)
      throw new HTTPException(404, { message: "Bootcamp not found" });
    if (bootcamp.user.toString() !== user._id && user.role !== "admin") {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    const course = await CourseModel.create({ ...body, user: user._id });
    return c.json({ success: true, data: course }, 201);
  }
);

app.put(
  "/:id",
  authenticate,
  authorize("publisher", "admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  zValidator(
    "json",
    z.object({
      title: z.string().trim().min(1).max(256).optional(),
      description: z.string().trim().min(1).max(256).optional(),
      weeks: z.number().min(1).max(20).optional(),
      tuition: z.number().min(1000).max(40000).optional(),
      minimumSkill: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      scholarshipAvailable: z.boolean().optional(),
      bootcamp: z.string().trim().max(256).optional(),
    })
  ),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.get("user");
    let course = await CourseModel.findById(id);
    if (!course) throw new HTTPException(404, { message: "Course not found" });
    if (course.user.toString() !== user._id && user.role !== "admin") {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    course = await CourseModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    return c.json({ success: true, data: course }, 200);
  }
);

app.delete(
  "/:id",
  authenticate,
  authorize("publisher", "admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");
    const course = await CourseModel.findById(id);
    if (!course) throw new HTTPException(404, { message: "Course not found" });
    if (course.user.toString() !== user._id && user.role !== "admin") {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    await course.deleteOne();
    return c.json({ success: true, data: {} }, 200);
  }
);

export default app;
