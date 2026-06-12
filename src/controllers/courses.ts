import { NextFunction, Request, Response } from "express";
import BootcampModel from "../models/Bootcamp";
import CourseModel from "../models/Course";
import asyncHandler from "express-async-handler";
import serverResponse from "../utils/helpers/responses";
import messages from "../config/messages";

/**
 * Get all courses
 * @route GET /api/v1/courses
 * @route GET /api/v1/bootcamps/:bootcampId/courses
 * @access Public
 */

export const getCourses = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.params.bootcampId) {
      const courses = await CourseModel.find({
        bootcamp: req.params.bootcampId,
      });
      serverResponse.sendSuccess(res, messages.SUCCESSFUL, courses);
    } else {
      serverResponse.sendSuccess(res, messages.SUCCESSFUL, res.advancedResults);
    }
  },
);

/**
 * Get single course
 * @route GET /api/v1/:id
 * @access Public
 */
export const getCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await CourseModel.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description",
    });

    if (!course) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }
    serverResponse.sendSuccess(res, messages.SUCCESSFUL, course);
  },
);

/**
 * Add a course
 * @route POST /api/v1/bootcamps/:bootcampId/courses
 * @access Private
 */
export const addCourse = asyncHandler(async (req: Request, res: Response) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await BootcampModel.findById(req.params.bootcampId);

  if (!bootcamp) {
    serverResponse.sendError(res, messages.NOT_FOUND);
  }

  /*Make Sure User is Bootcamp owner */
  if (bootcamp?.user.toString() !== req.user.id && req.user.role !== "admin") {
    serverResponse.sendError(res, messages.UNAUTHORIZED);
  }

  const course = await CourseModel.create(req.body);
  serverResponse.sendSuccess(res, messages.SUCCESSFUL, course);
});

/**
 * Update a course
 * @route PUT /api/v1/courses/:id
 * @access Private
 */
export const updateCourse = asyncHandler(
  async (req: Request, res: Response) => {
    let course = await CourseModel.findById(req.params.id);

    if (!course) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }
    /*Make Sure User is Course owner */
    if (course?.user.toString() !== req.user.id && req.user.role !== "admin") {
      serverResponse.sendError(res, messages.UNAUTHORIZED);
    }
    course = await CourseModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    serverResponse.sendSuccess(res, messages.SUCCESSFUL, course);
  },
);

/**
 * Delete a course
 * @route DELETE /api/v1/courses/:id
 * @access Private
 */
export const deleteCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await CourseModel.findById(req.params.id);

    if (!course) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }
    /*Make Sure User is Course owner */
    if (course?.user.toString() !== req.user.id && req.user.role !== "admin") {
      serverResponse.sendError(res, messages.UNAUTHORIZED);
    }
    await course?.deleteOne();
    serverResponse.sendSuccess(res, messages.SUCCESSFUL, {});
  },
);
