import { IUser } from "./../../models/User";

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
    export interface Response {
      advancedResults: {
        success: boolean;
        count: number;
        pagination: object;
        data: object;
      };
    }
  }
}
