
import { config } from "dotenv";
import path from "path";

const result = config({ path: path.resolve(__dirname, ".env") });
console.log("Dotenv config result:", result);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
