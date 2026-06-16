// import express, { Request, Response } from "express";
// import errorHandler from "./middlewares/error";
// import cookieParser from "cookie-parser";
// import bodyParser from "body-parser";
// import cors from "cors";
// import morgan from "morgan";
// import helmet from "helmet";

import { Hono } from "hono";

import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import connectDb from "./db/index";
import { ensureBucket } from "./config/s3";
import { serve } from "@hono/node-server";
import { HTTPException } from "hono/http-exception";

connectDb();
ensureBucket();

import bootcamps from "./routes/bootcamps";
import auth from "./routes/auth";
import reviews from "./routes/reviews";
import courses from "./routes/courses";
import users from "./routes/users";

const app = new Hono().basePath("/api/v1");

app.use(cors());
app.use(logger());
app.use(secureHeaders());
app.get("/", (c) => {
  return c.redirect("https://documenter.getpostman.com/view/19017681/UVyoXeJR");
});

app.route("/bootcamps", bootcamps);
app.route("/auth", auth);
app.route("/reviews", reviews);
app.route("/courses", courses);
app.route("/users", users);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
});

serve({
  fetch: app.fetch,
  port: 8080,
});

const server = serve(app);
// graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
export default app;
