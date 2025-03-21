import EventEmitter from "events";

import { JsonValue } from "@bufbuild/protobuf";

export enum LOG_EVENT {
  DEBUG = "aserto-node-debug",
  ERROR = "aserto-node-error",
  INFO = "aserto-node-info",
  TRACE = "aserto-node-trace",
  WARN = "aserto-node-warn",
}

export const LOG_LEVELS = {
  ERROR: 4,
  WARN: 3,
  INFO: 2,
  DEBUG: 1,
  TRACE: 0,
} as const;

class Logger {
  eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter = getLogEventEmitter()) {
    this.eventEmitter = eventEmitter;
  }

  trace(message: JsonValue) {
    this.eventEmitter.emit(LOG_EVENT.TRACE, message);
  }

  info(message: JsonValue) {
    this.eventEmitter.emit(LOG_EVENT.INFO, message);
  }
  debug(message: JsonValue) {
    this.eventEmitter.emit(LOG_EVENT.DEBUG, message);
  }

  warn(message: JsonValue) {
    this.eventEmitter?.emit(LOG_EVENT.WARN, message);
  }

  error(message: JsonValue) {
    this.eventEmitter.emit(LOG_EVENT.ERROR, message);
  }
}

const logEventEmitter = new EventEmitter();
let logger = new Logger(logEventEmitter);
const setLogEventEmitter = (eventEmitter?: EventEmitter) => {
  logger = new Logger(eventEmitter || logEventEmitter);
};

export const getLogEventEmitter = () => logEventEmitter;

export { logger, setLogEventEmitter };
