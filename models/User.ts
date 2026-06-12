import { model, Schema, InferSchemaType } from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import * as crypto from "crypto";
import { JWT_EXPIRE, JWT_SECRET } from "../config/config";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email",
      ],
    },
    role: {
      type: String,
      enum: ["user", "publisher"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    methods: {
      getSignedJwtToken() {
        return sign({ id: this._id }, JWT_SECRET, {
          expiresIn: JWT_EXPIRE as any,
        });
      },
      getResetPasswordRoken() {
        const resetToken = crypto.randomBytes(20).toString("hex");

        /*Hash token and set to resetPasswordToken field */
        this.resetPasswordToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        /*Set Expiration */
        this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

        return resetToken;
      },
      async matchPassword(enteredPassword: string) {
        return await compare(enteredPassword, this.password);
      },
    },
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await genSalt(10);
  this.password = await hash(this.password, salt);
});

const UserModel = model("User", UserSchema);

export type User = InferSchemaType<typeof UserSchema>;
export default UserModel;
