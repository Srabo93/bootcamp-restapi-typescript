// import express, { Request, Response } from "express";
import path from "path";
import { NODE_ENV } from "./config/config";
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
import { serve } from "@hono/node-server";
import { HTTPException } from "hono/http-exception";

//connection from db here
connectDb();

// //routing
// import bootcampRoutes from "./routes/bootcamps";
// import authRoutes from "./routes/auth";
// import reviewRoutes from "./routes/reviews";
// import courseRoutes from "./routes/courses";
// import usersRoutes from "./routes/users";
import bootcamps from "./routes/bootcamps";

const app = new Hono().basePath("/api/v1");

app.use(cors());
app.use(logger());
app.use(secureHeaders());
app.get("/", (c) => {
  return c.redirect("https://documenter.getpostman.com/view/19017681/UVyoXeJR");
});

app.route("/bootcamps", bootcamps);

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
export default app;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, "public")));
//
// app.use("/api/v1/bootcamps", upload.single("file"), bootcampRoutes);
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/reviews", reviewRoutes);
// app.use("/api/v1/courses", courseRoutes);
// app.use("/api/v1/users", usersRoutes);
//
