import { Opcode } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import { JsonValue } from "@bufbuild/protobuf";

import { Authorizer, authz } from "./authorizer";
import AnonymousIdentityMapper from "./authorizer/mapper/identity/anonymous";
import JWTIdentityMapper from "./authorizer/mapper/identity/jwt";
import ManualIdentityMapper from "./authorizer/mapper/identity/manual";
import SubIdentityMapper from "./authorizer/mapper/identity/sub";
import PolicyPathMapper from "./authorizer/mapper/policy/path";
import { Middleware, ObjectIDFromVar } from "./authorizer/middleware";
import decisionTreeOptions from "./authorizer/model/decisionTreeOptions";
import identityContext from "./authorizer/model/identityContext";
import policyContext from "./authorizer/model/policyContext";
import policyInstance from "./authorizer/model/policyInstance";
import queryOptions from "./authorizer/model/queryOptions";
import {
  createAsyncIterable,
  createImportRequest,
  DirectoryServiceV3,
  DirectoryV3,
  HEADER_ASERTO_MANIFEST_REQUEST,
  ImportMsgCase,
  MANIFEST_REQUEST_DEFAULT,
  MANIFEST_REQUEST_METADATA_ONLY,
  MANIFEST_REQUEST_MODEL_ONLY,
  MANIFEST_REQUEST_WITH_MODEL,
  objectPropertiesAsStruct,
  readAsyncIterable,
  serializeAsyncIterable,
} from "./directory/v3";
import { CustomHeaders, DirectoryV3Config } from "./directory/v3/types";
import { displayStateMap } from "./displayStateMap";
import { is } from "./is";
import { AuthzOptions, jwtAuthz } from "./jwtAuthz";
import {
  getLogEventEmitter,
  LOG_EVENT_NAMES,
  LOG_LEVELS,
  setLogEventEmitter,
} from "./log";

type LogLevel = keyof typeof LOG_LEVELS;
const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL || "INFO") as LogLevel];

const log = (message: JsonValue, level: number = LOG_LEVELS.INFO) => {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_TRACE) {
    // eslint-disable-next-line no-console
    console.trace(`${timestamp} ${level}: ${message}`);
  } else {
    if (level === LOG_LEVELS.ERROR) {
      // eslint-disable-next-line no-console
      console.error(`${timestamp} ${level}: ${message}`);
    } else if (level >= currentLevel) {
      // eslint-disable-next-line no-console
      console.log(`${timestamp} ${level}: aserto-node: ${message}`);
    }
  }
};

const logEventEmitter = getLogEventEmitter();

logEventEmitter.on(LOG_EVENT_NAMES.DEBUG, (message) => {
  log(message, LOG_LEVELS.DEBUG);
});

logEventEmitter.on(LOG_EVENT_NAMES.ERROR, (message) => {
  log(message, LOG_LEVELS.ERROR);
});

logEventEmitter.on(LOG_EVENT_NAMES.INFO, (message) => {
  log(message, LOG_LEVELS.INFO);
});

logEventEmitter.on(LOG_EVENT_NAMES.TRACE, (message) => {
  log(message, LOG_LEVELS.TRACE);
});

logEventEmitter.on(LOG_EVENT_NAMES.WARN, (message) => {
  log(message, LOG_LEVELS.WARN);
});

export {
  AnonymousIdentityMapper,
  Authorizer,
  authz,
  AuthzOptions,
  createAsyncIterable,
  createImportRequest,
  CustomHeaders,
  decisionTreeOptions,
  DirectoryServiceV3,
  DirectoryV3,
  DirectoryV3Config,
  displayStateMap,
  HEADER_ASERTO_MANIFEST_REQUEST,
  identityContext,
  ImportMsgCase,
  Opcode as ImportOpCode,
  is,
  jwtAuthz,
  JWTIdentityMapper,
  LOG_EVENT_NAMES,
  logEventEmitter,
  MANIFEST_REQUEST_DEFAULT,
  MANIFEST_REQUEST_METADATA_ONLY,
  MANIFEST_REQUEST_MODEL_ONLY,
  MANIFEST_REQUEST_WITH_MODEL,
  ManualIdentityMapper,
  Middleware,
  ObjectIDFromVar,
  objectPropertiesAsStruct,
  policyContext,
  policyInstance,
  PolicyPathMapper,
  queryOptions,
  readAsyncIterable,
  serializeAsyncIterable,
  setLogEventEmitter,
  SubIdentityMapper,
};

export * from "./authorizer/types";
export * from "./directory/v3/types";
export * from "./errors";
export * from "@bufbuild/protobuf";
