import { Job, Queue } from "bullmq";

// NOTE: this's a job queue, so instead of processign data immediatly we do
// 1: add job to queue
// 2: return response immediatly ("job currently processing")
// 3: worker pick up a job in the background
// 4: worker complete job and store result
// without queue this will be: user > api > compile (wait ~4 secs) > response
// with queue: user > api > add to queue                                                                               > response
//                                      > worker pick up job > compile in background > notify user (websocket/polling)
// this at the end should prvent the server from choking when multiple users try and compile at same time (async stuff)

// connection config for BullMQ
const connection = {
  host: "localhost",
  port: 6379,
};

// create queue for compilation jobs
export const compileQueue = new Queue("compile", { connection });

export { Job };
