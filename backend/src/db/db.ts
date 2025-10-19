import mongoose from "mongoose";
import {} from "";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${process.env.DB_NAME}`,
    );

    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};
export default connectDB;
