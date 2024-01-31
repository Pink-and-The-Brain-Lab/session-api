import "dotenv/config";
import mongoose from "mongoose";

const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;

mongoose
  .connect(`mongodb://${user}:${password}@localhost:27017/user_session?authSource=admin`)
  .then(() => {
    console.log("MongoDB connected!");
  })
  .catch((error) => {
    console.error(error);
  });
