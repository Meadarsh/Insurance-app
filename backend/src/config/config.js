import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key", // Change this in production
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 10080, // 7 days (7 * 24 * 60)
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 30,
  },
  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/",
  },
};
