const currentLevel = process.env.LOG_LEVEL || "INFO";

const logLevels = {
  ERROR: 0,
  INFO: 1,
  DETAIL: 2,
};

const log = (message: string, level = "INFO") => {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_TRACE) {
    // eslint-disable-next-line no-console
    console.trace(`${timestamp} ${level}: ${message}`);
  } else {
    if (level === "ERROR") {
      // eslint-disable-next-line no-console
      console.error(`${timestamp} ${level}: ${message}`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      /* @ts-ignore */
      //TODO: Remove this ts-ignore
    } else if (logLevels[level] <= logLevels[currentLevel]) {
      // eslint-disable-next-line no-console
      console.log(`${timestamp} ${level}: aserto-node: ${message}`);
    }
  }
};

export { log };
