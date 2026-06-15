import { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { JWT_SECRET } from "../config/config";

type Variables = JwtVariables & {
  user: { _id: string; role: "user" | "publisher" };
};

export const authenticate = async (
  c: Context<{ Variables: Variables }>,
  next: Next
) => {
  const jwtMiddleware = jwt({ secret: JWT_SECRET, alg: "HS256" });
  await jwtMiddleware(c, async () => {
    const { id, role } = c.get("jwtPayload");
    c.set("user", { _id: id, role });
    await next();
  });
};

export const authorize = (...roles: string[]) => {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Forbidden" });
    }
    await next();
  };
};
