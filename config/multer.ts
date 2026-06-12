import { Request } from "express";
import multer from "multer";
import path from "path";
type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallBack = (error: Error | null, filename: string) => void;

export const fileStorage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: DestinationCallback
  ): void {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: FileNameCallBack
  ): void {
    const ext = file.mimetype.split("/")[1];
    const uniqueSuffix = String(
      Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + ext
    );
    cb(null, String(file.filename + "-" + uniqueSuffix));
  },
});
