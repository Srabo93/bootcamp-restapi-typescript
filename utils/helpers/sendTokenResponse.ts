import { NODE_ENV } from "../../config/config";
import { JWT_COOKIE_EXPIRE } from "../../config/config";
import { Response } from "express";
import { CookieOptions } from "express";

const sendTokenResponse = (
  token: string,
  statusCode: number,
  res: Response
) => {
  const options: CookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (NODE_ENV === "production") {
    options.secure = true;
  }
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};

export default sendTokenResponse;
