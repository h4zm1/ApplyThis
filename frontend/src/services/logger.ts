const isDev = import.meta.env.DEV; // this will be true if we run 'npm run dev'

const logger = {
  log: (message: any, ...args: any[]) => {
    if (isDev) console.log(message, ...args);
  },
  error: (message: any, ...args: any[]) => {
    console.error(message, ...args);
  },
};
export default logger;
