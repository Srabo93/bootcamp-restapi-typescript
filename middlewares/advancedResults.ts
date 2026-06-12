import { NextFunction, Request, Response } from "express";
import { Bootcamp } from "../models/Bootcamp";
import { Course } from "../models/Course";
import { Review } from "../models/Review";
import { Model } from "mongoose";
import { User } from "../models/User";

interface Query {
  [key: string]: any;
  select: string;
  sort: string;
  page: string;
  limit: string;
}

type MongooseModels =
  | Model<Bootcamp>
  | Model<Course>
  | Model<Review>
  | Model<User>;

const advancedResults =
  (model: MongooseModels, populate?: string | any) =>
  async (
    req: Request<{}, {}, {}, Query>,
    res: Response,
    next: NextFunction,
  ) => {
    let query: any;
    //Copy req. query
    const reqQuery = { ...req.query };
    //Fields to exclude
    const removeFields = ["select", "sort", "page", "limit"];
    //Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);
    //Create query string
    let queryStr = JSON.stringify(reqQuery);
    //Create operators($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`,
    );
    //Finding resource
    if (model.modelName === "Bootcamp") {
      query = (model as Model<Bootcamp>).find(JSON.parse(queryStr));
      if (populate) {
        query = (model as Model<Bootcamp>)
          .find(JSON.parse(queryStr))
          .populate(populate);
      }
    } else if (model.modelName === "Course") {
      query = (model as Model<Course>).find(JSON.parse(queryStr));
      if (populate) {
        query = (model as Model<Course>)
          .find(JSON.parse(queryStr))
          .populate(populate);
      }
    } else if (model.modelName === "Review") {
      query = (model as Model<Review>).find(JSON.parse(queryStr));
      if (populate) {
        query = (model as Model<Review>)
          .find(JSON.parse(queryStr))
          .populate(populate);
      }
    } else if (model.modelName === "User") {
      query = (model as Model<User>).find(JSON.parse(queryStr));
      if (populate) {
        query = (model as Model<User>).find(JSON.parse(queryStr)).populate(
          populate,
        );
      }
    } else {
      return next(new Error("advanced result model not found"));
    }
    //Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }
    //Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }
    //Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    //Executing query
    const results = await query;
    //Pagination result
    interface Pagination {
      next: { page: number; limit: number };
      prev: { page: number; limit: number };
    }
    const pagination: Pagination = {
      next: {
        page: 0,
        limit: 0,
      },
      prev: {
        page: 0,
        limit: 0,
      },
    };

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.advancedResults = {
      success: true,
      count: results.length,
      pagination,
      data: results,
    };
    next();
  };

export default advancedResults;
