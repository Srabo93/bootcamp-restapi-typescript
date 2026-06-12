import { model, Schema, InferSchemaType } from "mongoose";

const CourseSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Please add a course title"],
    },
    description: {
      type: String,
      required: [true, "Please add a course description"],
    },
    weeks: {
      type: String,
      required: [true, "Please add number of weeks"],
    },
    tuition: {
      type: String,
      required: [true, "Please add a tuition cost"],
    },
    minimumSkill: {
      type: String,
      required: [true, "Please add a minimum Skill"],
      enum: ["beginner", "intermediate", "advanced"],
    },
    scholarshipAvailable: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bootcamp: {
      type: Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
    },
  },
  {
    statics: {
      async getAverageCost(bootcampId) {
        const obj = await this.aggregate([
          {
            $match: { bootcamp: bootcampId },
          },
          {
            $group: {
              _id: "$bootcamp",
              averageCost: { $avg: "$tuition" },
            },
          },
        ]);
        try {
          await model("Bootcamp").findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
          });
        } catch (err) {
          console.error(err);
        }
      },
    },
  }
);

export type Course = InferSchemaType<typeof CourseSchema>;

const CourseModel = model("Course", CourseSchema);

/*Call getAverageCost after save */
CourseSchema.post("save", function () {
  CourseModel.getAverageCost(this.bootcamp);
});

/*Call getAverageCost before remove */
CourseSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await CourseModel.getAverageCost(this.bootcamp);
  }
);

export default CourseModel;
