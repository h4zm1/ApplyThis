import pino from "pino";

const isDev = process.env.NODE_ENV == "development";

const logger = isDev
  ? pino({
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname", // hide process id and hostname
        },
      },
    })
  : pino({ level: "info" }); // plain old json since pino pretty have an overhead and debug messages won't be shown in prod

export default logger;
