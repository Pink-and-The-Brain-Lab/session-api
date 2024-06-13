import "dotenv/config";
import mongoose from "mongoose";

const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST;
const port = process.env.MONGO_PORT;
const source = process.env.MONGO_AUTH_SOURCE;

mongoose
  .connect(
    `mongodb://${user}:${password}@${host}:${port}/user_session?authSource=${source}`
  )
  .then(() => {
    console.log("MongoDB connected!");
  })
  .catch((error) => {
    console.error(error);
  });
