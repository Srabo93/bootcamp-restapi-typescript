import { model, Schema, InferSchemaType } from "mongoose";

const ReviewSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Please add a title for the review"],
      maxlength: 100,
    },
    text: {
      type: String,
      required: [true, "Please add some text"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      required: [true, "Please add a rating between 1-10"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    bootcamp: {
      type: Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    statics: {
      async getAverageRating(bootcampId) {
        const obj = await this.aggregate([
          {
            $match: { bootcamp: bootcampId },
          },
          {
            $group: {
              _id: "$bootcamp",
              averageRating: { $avg: "$rating" },
            },
          },
        ]);
        try {
          await model("Bootcamp").findByIdAndUpdate(bootcampId, {
            averageRating: obj[0].averageRating,
          });
        } catch (err) {
          console.error(err);
        }
      },
    },
  }
);

ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

export type Review = InferSchemaType<typeof ReviewSchema>;

const ReviewModel = model("Review", ReviewSchema);

/*Call getAverageRating after save */
ReviewSchema.post("save", function () {
  ReviewModel.getAverageRating(this.bootcamp);
});

/*Call getAverageRating before remove */
ReviewSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await ReviewModel.getAverageRating(this.bootcamp);
  }
);
export default ReviewModel;
