const currentLevel = process.env.LOG_LEVEL || "INFO";

const logLevels = {
  ERROR: 0,
  INFO: 1,
  DETAIL: 2,
};

const log = (message: string, level = "INFO") => {
  const timestamp = new Date().toISOString();
  if (level === "ERROR") {
    console.error(`${timestamp} ${level}: ${message}`);
    /* @ts-ignore */
    //TODO: Remove this ts-ignore
  } else if (logLevels[level] <= logLevels[currentLevel]) {
    console.log(`${timestamp} ${level}: ${message}`);
  }
};

export { log };
