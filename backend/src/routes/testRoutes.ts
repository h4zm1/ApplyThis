import { Queue } from "bullmq";
import { Router } from "express";
import logger from "../config/logger";

const router = Router();

// create queue instance
const testQueue = new Queue("demo", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

router.post("/job", async (req, res) => {
  const { message } = req.body;

  //push job/data to queue, bullmq will take the job data, serialize into a json string and store it in redis data structures (lists, hashes, sets...)
  const job = await testQueue.add("test-job", {
    message: message || "hello from queue",
  });

  logger.info({ jobId: job.id }, "job added to queue");

  // return immediatly, don't for job to finish
  res.json({
    success: true,
    jobId: job.id,
    message: "job added to queue",
  });
});

export default router;
