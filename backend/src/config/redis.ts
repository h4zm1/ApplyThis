import Redis from "ioredis";
import logger from "./logger";

// this's like a giant hashmap, that lives outside the app and persist data
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ for blockking commands
});

redis.on("connect", () => {
  // connection event listener
  logger.info("redis connected");
});

redis.on("error", (err) => {
  logger.error({ message: err.message }, "redis error");
});

export default redis;
