import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Use process.cwd() to always resolve from the project root,
// regardless of where Prisma CLI internally loads this file from.
dotenv.config({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
