// NOTE: just for testing, to see if memurai redis is working fine on windows

import { Worker, Job } from "bullmq";
import logger from "../config/logger";

// define what data this work expect
interface demoJobData {
  message: string;
}

// create a worker that process jobs from "demo" queue
export const demoWorker = new Worker<demoJobData>(
  "demo", // queue name, this what the worker will be listening to, so the queue need to be name exactly this (per bullmq doc)
  async (job: Job<demoJobData>) => {
    // this runs in background when job is picked up
    logger.info({ jobId: job.id, data: job.data }, "processing demo job");

    // simulate some work
    await new Promise((resolve) => setTimeout(resolve, 6000));

    logger.info({ JobId: job.id }, "demo job completed");

    return { success: true, processed: job.data.message };
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  },
);

logger.info("demo worker starting...");

demoWorker.on("ready", () => {
  logger.info("demo worker ready listening for jobs");
});

// handle worker events
demoWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, result: job.returnvalue }, "job finished");
});

demoWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "job failed");
});
