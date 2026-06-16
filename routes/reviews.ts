import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import ReviewModel from "../models/Review";
import BootcampModel from "../models/Bootcamp";
import { authenticate, authorize } from "../middlewares/auth";

const app = new Hono();

app.get("/", async (c) => {
  const reviews = await ReviewModel.find({});
  return c.json({ success: true, count: reviews.length, data: reviews }, 200);
});

app.get(
  "/:id",
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const review = await ReviewModel.findById(id).populate({
      path: "bootcamp",
      select: "name description",
    });
    if (!review) throw new HTTPException(404, { message: "Review not found" });
    return c.json({ success: true, data: review }, 200);
  }
);

app.post(
  "/",
  authenticate,
  authorize("user", "admin"),
  zValidator(
    "json",
    z.object({
      title: z.string().trim().min(1).max(100),
      text: z.string().trim().min(1),
      rating: z.number().min(1).max(10),
      bootcamp: z.string().trim().max(256),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");
    const bootcamp = await BootcampModel.findById(body.bootcamp);
    if (!bootcamp)
      throw new HTTPException(404, { message: "Bootcamp not found" });
    const review = await ReviewModel.create({ ...body, user: user._id });
    return c.json({ success: true, data: review }, 201);
  }
);

app.put(
  "/:id",
  authenticate,
  authorize("user", "admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  zValidator(
    "json",
    z.object({
      title: z.string().trim().min(1).max(100).optional(),
      text: z.string().trim().min(1).optional(),
      rating: z.number().min(1).max(10).optional(),
    })
  ),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.get("user");
    let review = await ReviewModel.findById(id);
    if (!review) throw new HTTPException(404, { message: "Review not found" });
    if (review.user.toString() !== user._id) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    review = await ReviewModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    return c.json({ success: true, data: review }, 200);
  }
);

app.delete(
  "/:id",
  authenticate,
  authorize("user", "admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");
    const review = await ReviewModel.findById(id);
    if (!review) throw new HTTPException(404, { message: "Review not found" });
    if (review.user.toString() !== user._id) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    await review.deleteOne();
    return c.json({ success: true, data: {} }, 200);
  }
);

export default app;
