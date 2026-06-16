import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import UserModel from "../models/User";
import { authenticate, authorize } from "../middlewares/auth";

const app = new Hono();

app.get("/", authenticate, authorize("admin"), async (c) => {
  const users = await UserModel.find({});
  return c.json({ success: true, count: users.length, data: users }, 200);
});

app.get(
  "/:id",
  authenticate,
  authorize("admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await UserModel.findById(id);
    if (!user) throw new HTTPException(404, { message: "User not found" });
    return c.json({ success: true, data: user }, 200);
  }
);

app.post(
  "/",
  authenticate,
  authorize("admin"),
  zValidator(
    "json",
    z.object({
      name: z.string().trim().min(1).max(256),
      email: z.string().trim().email(),
      password: z.string().trim().min(6).max(256),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const exists = await UserModel.findOne({ email: body.email });
    if (exists) throw new HTTPException(409, { message: "User already exists" });
    const user = await UserModel.create(body);
    return c.json({ success: true, data: user }, 201);
  }
);

app.put(
  "/:id",
  authenticate,
  authorize("admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  zValidator(
    "json",
    z.object({
      name: z.string().trim().min(1).max(256).optional(),
      email: z.string().trim().email().optional(),
      password: z.string().trim().min(6).max(256).optional(),
    })
  ),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = await UserModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new HTTPException(404, { message: "User not found" });
    return c.json({ success: true, data: user }, 200);
  }
);

app.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  zValidator("param", z.object({ id: z.string().trim().max(256) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) throw new HTTPException(404, { message: "User not found" });
    return c.json({ success: true, data: {} }, 200);
  }
);

export default app;
