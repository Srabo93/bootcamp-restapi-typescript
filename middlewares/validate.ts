import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    schema
      .parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        user: req.user,
        file: req.file,
      })
      .catch((reason) => {
        return res.json(reason);
      });
    next();
  };
export default validate;
