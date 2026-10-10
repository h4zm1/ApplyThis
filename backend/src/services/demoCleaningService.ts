import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import prisma from "../config/database";
import logger from "../config/logger";
import s3Client from "../config/s3";
import nodeCron from "node-cron";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

async function deleteByPrefix(prefix: string) {
  let token: string | undefined;
  do {
    const list = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    const objects = (list.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (objects.length) {
      const res = await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: objects },
        }),
      );
      if (res.Errors?.length)
        throw new Error(`failed to delete ${res.Errors.length} objects`);
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);
}

export async function cleanupExpiredDemoUsers() {
  const aDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const expired = await prisma.user.findMany({
    where: { isDemo: true, createdAt: { lt: aDay } }, // everyting older than 24h
    select: { id: true },
  });

  for (const { id } of expired) {
    try {
      // files first, if storage fail the user can stay for another retry
      await deleteByPrefix(`resume/demo-${id}-`);
      await deleteByPrefix(`thumbnail/demo-${id}-`);
      await prisma.user.delete({ where: { id } }); // cascade to resumes, jobs, history
    } catch (error) {
      logger.error({ error, userId: id }, "demo cleanup failed");
    }
  }
  logger.info({ count: expired.length }, "demo cleanup finished");
}

let running = false;

async function run() {
  // if one run takes longer than an hour, don't start a second one on top of it
  if (running) return;
  running = true;
  try {
    await cleanupExpiredDemoUsers();
  } catch (error) {
    logger.error({ error }, "demo cleanup crashed");
  } finally {
    running = false;
  }
}

export function startDemoCleanup() {
  nodeCron.schedule("0 * * * *", run); // run every hour
  run(); // also run every server boot in case server was down
}
