// load env vars first before any imports
import dotenv from "dotenv";
// load .env file
dotenv.config();

import express from "express";
import cors from "cors";
import prisma from "./config/database";
import compileRoutes from "./routes/compileRoutes";
import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";
import logger from "./config/logger";
import redis from "./config/redis";
import { demoWorker } from "./jobs/testJob";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

// create express app
const app = express();
const PORT = process.env.PORT || 3000;

// middleware : run on every request
app.use(cors()); // alow to create cross origin requests
app.use(express.json()); // like @RequestBody in spring (parse json bodies)
app.use(requestLogger); // display some info about every request

// health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // test database connection
    await prisma.$connect();
    const redisStatus = redis.status === "ready" ? "connected" : "disconnected";

    res.json({
      status: "ok",
      database: "connected",
      redis: redisStatus,
      timeStamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      timeStamp: new Date().toISOString(),
    });
  }
});
//         routes
// mount compilte routes at /api/compile
// like @RequestMapping("/api/compile") but done here, how about that
// take all routes defined under compileRoutes and mount them under /api/compile
// so router.post("/") become POST /api/compile     router.get('/:id') become GET /api/compile/:id
app.use("/api/compile", compileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

// 404 handler
// this need to placed under all routes, if it were at the top it will catch all requests and get "not found" for all routes
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

// shutdown (for connection pooling)
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  await demoWorker.close();
  redis.disconnect();
});

// start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
