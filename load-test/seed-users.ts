import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { MONGODB_URI } from "../config/config";
import UserModel from "../models/User";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDb = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      autoIndex: false,
      maxPoolSize: 10,
    });
    console.log(`mongodb connected: ${connection.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection unsuccessful.", error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const csvPath = path.join(__dirname, "users.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n");

  let created = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const [email, password] = lines[i].split(",");
    const name = email.split("@")[0];

    const exists = await UserModel.findOne({ email });
    if (exists) {
      console.log(`  SKIP ${email} (already exists)`);
      skipped++;
      continue;
    }

    await UserModel.create({ name, email, password, role: "user" });
    console.log(`  OK   ${email}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  process.exit(0);
};

const run = async () => {
  await connectDb();
  await seedUsers();
};

run();
