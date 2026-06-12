import { connect } from "mongoose";
import { MONGODB_URI } from "../config/config";

const connectDb = async () => {
  const options = {
    autoIndex: false,
    maxPoolSize: 10,
  };

  try {
    const connection = await connect(MONGODB_URI, options);
    console.log(`mongodb connected: ${connection.connection.host}`);
  } catch (error) {
    console.log(
      "MongoDB connection unsuccessful, retry after 2 seconds.",
      error
    );
  }
};

export default connectDb;
