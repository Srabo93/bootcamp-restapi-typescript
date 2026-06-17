import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import BootcampModel from "../models/Bootcamp";
import ReviewModel from "../models/Review";
import { authenticate, authorize } from "../middlewares/auth";
import { uploadFile, deleteFile, getObjectUrl } from "../config/s3";
import { S3_ENDPOINT, S3_BUCKET } from "../config/config";

const app = new Hono();

const paramSchema = z.object({
  bootcampId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

app.get("/", async (c) => {
  const allBootcamps = await BootcampModel.find({}).populate("courses");

  return c.json(allBootcamps);
});

app.get("/:bootcampId", zValidator("param", paramSchema), async (c) => {
  const { bootcampId } = c.req.valid("param");
  const bootcamp = await BootcampModel.findById(bootcampId).populate("courses");

  if (!bootcamp) throw new HTTPException(404);
  return c.json(bootcamp);
});

app.get("/:bootcampId/courses", zValidator("param", paramSchema), async (c) => {
  const { bootcampId } = c.req.valid("param");
  const bootcamp = await BootcampModel.findById(
    bootcampId,
    "name description website"
  )
    .populate("courses")
    .exec();

  if (!bootcamp) throw new HTTPException(404);
  return c.json(bootcamp);
});

app.get("/:bootcampId/reviews", zValidator("param", paramSchema), async (c) => {
  const { bootcampId } = c.req.valid("param");
  const reviews = await ReviewModel.find({
    bootcamp: bootcampId,
  });

  return c.json(reviews);
});

app.post(
  "/",
  authenticate,
  authorize("publisher", "admin"),
  zValidator(
    "json",
    z.object({
      name: z.string().trim().min(1).max(50),
      description: z.string().trim().min(1).max(500),
      website: z.string().trim().url().optional(),
      phone: z.string().trim().max(20).optional(),
      email: z.string().trim().email().optional(),
      address: z.string().trim().min(1),
      careers: z.array(z.string()).min(1),
      housing: z.boolean().optional(),
      jobAssistance: z.boolean().optional(),
      jobGuarantee: z.boolean().optional(),
      acceptGi: z.boolean().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");
    const bootcampExists = await BootcampModel.findOne({ user: user._id });

    if (bootcampExists) {
      throw new HTTPException(409, { message: "Already exists" });
    }

    const newBootcamp = await BootcampModel.create({ ...body, user: user._id.toString() });
    return c.json(newBootcamp, 201);
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
      name: z.string().trim().min(1).max(50).optional(),
      description: z.string().trim().min(1).max(500).optional(),
      website: z.string().trim().url().optional(),
      phone: z.string().trim().max(20).optional(),
      email: z.string().trim().email().optional(),
      address: z.string().trim().min(1).optional(),
      careers: z.array(z.string()).min(1).optional(),
      housing: z.boolean().optional(),
      jobAssistance: z.boolean().optional(),
      jobGuarantee: z.boolean().optional(),
      acceptGi: z.boolean().optional(),
    })
  ),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.get("user");
    let bootcamp = await BootcampModel.findById(id);

    if (!bootcamp) {
      throw new HTTPException(404, { message: "Bootcamp not found" });
    }

    if (!bootcamp?.user.equals(user._id)) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    bootcamp = await BootcampModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    return c.json({ success: true, data: bootcamp }, 200);
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
    const bootcamp = await BootcampModel.findById(id);

    if (!bootcamp) {
      throw new HTTPException(404, { message: "Bootcamp not found" });
    }

    if (!bootcamp.user.equals(user._id)) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    await bootcamp.deleteOne();
    return c.json({ success: true, data: {} }, 200);
  }
);

app.put(
  "/:id/photo",
  authenticate,
  authorize("publisher", "admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");
    const bootcamp = await BootcampModel.findById(id);

    if (!bootcamp) {
      throw new HTTPException(404, { message: "Bootcamp not found" });
    }

    if (!bootcamp.user.equals(user._id)) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const body = await c.req.parseBody();
    const file = body["file"] as File | undefined;

    if (!file) {
      throw new HTTPException(400, { message: "Please upload a file" });
    }

    const allowedMimes = ["image/png", "image/jpg", "image/jpeg"];
    if (!allowedMimes.includes(file.type)) {
      throw new HTTPException(400, {
        message:
          "Invalid file type. Only PNG, JPG, and JPEG images are allowed",
      });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new HTTPException(400, {
        message: "File too large. Max 10MB allowed",
      });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const key = `bootcamps/${id}/photo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(buffer, key, file.type);
    const photoUrl = getObjectUrl(key);

    const prefix = `${S3_ENDPOINT}/${S3_BUCKET}/`;
    if (
      bootcamp.photo &&
      bootcamp.photo !== "no-photo.jpg" &&
      bootcamp.photo.startsWith(prefix)
    ) {
      const oldKey = bootcamp.photo.slice(prefix.length);
      await deleteFile(oldKey).catch(() => {});
    }

    bootcamp.photo = photoUrl;
    await bootcamp.save();

    return c.json({ success: true, data: bootcamp }, 200);
  }
);

export default app;
