"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const currentLevel = process.env.LOG_LEVEL || "INFO";
const logLevels = {
    ERROR: 0,
    INFO: 1,
    DETAIL: 2,
};
const log = (message, level = "INFO") => {
    const timestamp = new Date().toISOString();
    if (level === "ERROR") {
        // eslint-disable-next-line no-console
        console.error(`${timestamp} ${level}: ${message}`);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        /* @ts-ignore */
        //TODO: Remove this ts-ignore
    }
    else if (logLevels[level] <= logLevels[currentLevel]) {
        // eslint-disable-next-line no-console
        console.log(`${timestamp} ${level}: express-jwt-aserto: ${message}`);
    }
};
exports.log = log;
//# sourceMappingURL=log.js.map