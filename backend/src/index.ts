import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import db from "./db/db";
import { userRoutes } from "./routes/user.route.js";

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";

(async () => await db())();

const app = new Elysia()
  .use(
    cors({
      origin: ORIGIN,
      allowedHeaders: ["Content-Type"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    })
  )
  .group("/api/v1", (app) => app.use(userRoutes))
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
