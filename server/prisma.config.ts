import "dotenv/config";
import { defineConfig } from "prisma/config";
import { appConfig } from "./src/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: appConfig.database_url,
  },
});
