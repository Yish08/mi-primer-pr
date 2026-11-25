import mongoose from "mongoose";

mongoose.set("sanitizeFilter", true);

const connectDB = async () => {
  try {
    mongoose.set("sanitizeFilter", true);
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-db-test",
    );
    console.log(`MongoDB connected ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting MongoDB");
    process.exit(1);
  }
};

export default connectDB;
