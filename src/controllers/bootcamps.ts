import { NextFunction, Request, Response } from "express";
import BootcampModel from "../models/Bootcamp";
import asyncHandler from "express-async-handler";
import serverResponses from "../utils/helpers/responses";
import messages from "../config/messages";
import geocoder from "../utils/geocoder";
import serverResponse from "../utils/helpers/responses";

/**
 * Get all bootcamps
 * @route GET /api/v1/bootcamps
 * @access Public
 */
export const getBootcamps = asyncHandler(
  async (req: Request, res: Response) => {
    serverResponses.sendSuccess(res, messages.SUCCESSFUL, res.advancedResults);
  },
);

/**
 * Get single bootcamps
 * @route GET /api/v1/bootcamps/:id
 * @access Public
 */
export const getBootcamp = asyncHandler(async (req: Request, res: Response) => {
  const bootcamp = await BootcampModel.findById(req.params.id);
  if (!bootcamp) {
    serverResponses.sendError(res, messages.NOT_FOUND);
  }
  serverResponses.sendSuccess(res, messages.SUCCESSFUL, bootcamp);
});

/**
 * Create new bootcamp
 * @route POST /api/v1/bootcamps
 * @access Private
 */
export const createBootcamp = asyncHandler(
  async (req: Request, res: Response) => {
    req.body.user = req.user?.id;

    const bootcampExists = await BootcampModel.findOne({ user: req.user?.id });

    if (bootcampExists && req.user?.role !== "admin") {
      serverResponses.sendError(res, messages.ALREADY_EXIST);
    }

    const newBootcamp = await BootcampModel.create(req.body);
    serverResponses.sendSuccess(res, messages.SUCCESSFUL, newBootcamp);
  },
);

/**
 * Update bootcamp
 * @route PUT /api/v1/bootcamps/:id
 * @access Private
 */
export const updateBootcamp = asyncHandler(
  async (req: Request, res: Response) => {
    let bootcamp = await BootcampModel.findById(req.params.id);

    if (!bootcamp) {
      serverResponses.sendError(res, messages.NOT_FOUND);
    }

    if (!bootcamp?.user.equals(req.user.id) && req.user?.role !== "admin") {
      serverResponses.sendError(res, messages.UNAUTHORIZED);
    }

    bootcamp = await BootcampModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    serverResponses.sendSuccess(res, messages.SUCCESSFUL_UPDATE, bootcamp);
  },
);

/**
 * Delete bootcamp
 * @route DELETE /api/v1/bootcamps/:id
 * @access Private
 */
export const deleteBootcamp = asyncHandler(
  async (req: Request, res: Response) => {
    const bootcamp = await BootcampModel.findById(req.params.id);

    if (!bootcamp) {
      serverResponses.sendError(res, messages.NOT_FOUND);
    }

    if (!bootcamp?.user.equals(req.user.id) && req.user?.role !== "admin") {
      serverResponses.sendError(res, messages.UNAUTHORIZED);
    }

    await bootcamp?.deleteOne();
    serverResponses.sendSuccess(res, messages.SUCCESSFUL_DELETE, {});
  },
);

/**
 * Get Bootcamps within a radius
 * @route GET /api/v1/bootcamps/radius/:zipcode/:distance
 * @access Private
 */
export const getBootcampsInRadius = asyncHandler(
  async (req: Request, res: Response) => {
    const { zipcode, distance } = req.params;

    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    const radius = Number(distance) / 6378.1;

    const bootcamps = await BootcampModel.find({
      location: {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    });
    serverResponses.sendSuccess(res, messages.SUCCESSFUL, bootcamps);
  },
);

/**
 * Upload photo for bootcamp
 * @route PUT /api/v1/bootcamps/:id/photo
 * @access Private
 */
export const bootcampPhotoUpload = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      serverResponses.sendError(res, messages.IN_COMPLETE_REQUEST);
    }
    const bootcamp = await BootcampModel.findById(req.params.id);

    if (!bootcamp) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }

    if (bootcamp?.user !== req.user?.id && req.user?.role !== "admin") {
      serverResponse.sendError(res, messages.UNAUTHORIZED);
    }

    await BootcampModel.findByIdAndUpdate(req.params.id, {
      photo: req.file?.filename,
    });
    serverResponse.sendSuccess(res, messages.SUCCESSFUL_UPDATE, {});
  },
);
