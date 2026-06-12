import { Request, Response } from "express";
import ReviewModel from "../models/Review";
import BootcampModel from "../models/Bootcamp";
import asyncHandler from "express-async-handler";
import serverResponse from "../utils/helpers/responses";
import messages from "../config/messages";

/**
 * Get reviews
 * @route GET /api/v1/reviews
 * @route GET /api/v1/bootcamps/:bootcampId/reviews
 * @access Public
 */
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.bootcampId) {
    const reviews = await ReviewModel.find({ bootcamp: req.params.bootcampId });
    serverResponse.sendSuccess(res, messages.SUCCESSFUL, reviews);
  } else {
    serverResponse.sendSuccess(res, messages.SUCCESSFUL, res.advancedResults);
  }
});

/**
 * Get single review
 * @route GET /api/v1/reviews/:id
 * @access Public
 */
export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await ReviewModel.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!review) {
    serverResponse.sendError(res, messages.NOT_FOUND);
  }
  serverResponse.sendSuccess(res, messages.SUCCESSFUL, review);
});

/**
 * Add review
 * @route POST /api/v1/bootcamps/:bootcampId/reviews
 * @access Private
 */
export const addReview = asyncHandler(async (req: Request, res: Response) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await BootcampModel.findById(req.params.bootcampId);

  if (!bootcamp) {
    serverResponse.sendError(res, messages.NOT_FOUND);
  }

  const review = await ReviewModel.create(req.body);

  serverResponse.sendSuccess(res, messages.SUCCESSFUL, review);
});

/**
 * Update review
 * @route PUT /api/v1/reviews/:id
 * @access Private
 */
export const updateReview = asyncHandler(
  async (req: Request, res: Response) => {
    let review = await ReviewModel.findById(req.params.id);

    if (!review) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }

    /*Make sure review belongs to user or user is admin */
    if (review?.user.toString() !== req.user.id && req.user.role !== "admin") {
      serverResponse.sendError(res, messages.UNAUTHORIZED);
    }

    review = await ReviewModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    serverResponse.sendSuccess(res, messages.SUCCESSFUL, review);
  }
);

/**
 * Delete review
 * @route DELETE /api/v1/reviews/:id
 * @access Private
 */
export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await ReviewModel.findById(req.params.id);

    if (!review) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }

    /*Make sure review belongs to user or user is admin */
    if (review?.user.toString() !== req.user.id && req.user.role !== "admin") {
      serverResponse.sendError(res, messages.UNAUTHORIZED);
    }

    await review?.deleteOne();
    serverResponse.sendSuccess(res, messages.SUCCESSFUL_DELETE, {});
  }
);
