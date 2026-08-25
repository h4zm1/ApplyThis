import Redis from "ioredis";
import logger from "./logger";

// this's like a giant hashmap, that lives outside the app and persist data
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ for blockking commands
  lazyConnect: true, // don't connect on startup
  // limit rety attempts to avoid log spam
  retryStrategy(times) {
    if (times > 3) {
      logger.warn("redis unavailable");
      return 30000; // wait 30 sec
    }
    return Math.min(times * 1000, 3000); // ioredis increment an internal counter before passing it to retrystrat
  },
});

redis.on("connect", () => {
  // connection event listener
  logger.info("redis connected");
});

redis.on("err	or", (err) => {
  logger.error({ message: err.message }, "redis error");
});

export default redis;
