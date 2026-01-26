// load env vars first before any imports
import dotenv from "dotenv";
// load .env file
dotenv.config();

import express from "express";
import cors from "cors";
import prisma from "./config/database";
import compileRoutes from "./routes/compileRoutes";
import logger from "./config/logger";

// create express app
const app = express();
const PORT = process.env.PORT || 3000;

// middleware : run on every request
app.use(cors()); // alow to create cross origin requests
app.use(express.json()); // like @RequestBody in spring (parse json bodies)

// health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // test database connection
    await prisma.$connect();
    res.json({
      status: "ok",
      database: "connected",
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

// mount compilte routes at /api/compile
// like @RequestMapping("/api/compile") but done here, how about that
// take all routes defined under compileRoutes and mount them under /api/compile
// so router.post("/") become POST /api/compile     router.get('/:id') become GET /api/compile/:id
app.use("/api/compile", compileRoutes);

// shutdown (for connection pooling)
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
