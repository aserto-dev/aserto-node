import {
  Code,
  ConnectError,
  Interceptor,
  StreamRequest,
  UnaryRequest,
} from "@connectrpc/connect";

import { CustomHeaders } from "../directory/v3/types";
import {
  EtagMismatchError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";
import { log } from "../log";

export const setHeader = (
  req: UnaryRequest | StreamRequest,
  key: string,
  value: string,
) => {
  req.header.get(key) === null && req.header.set(key, value);
};

export const traceMessage: Interceptor = (next) => async (req) => {
  log(JSON.stringify(req));
  return await next(req);
};

export const setCustomHeaders = (headers: CustomHeaders) => {
  const customHaders: Interceptor = (next) => async (req) => {
    for (const [key, value] of Object.entries(headers)) {
      setHeader(req, key, value);
    }
    return await next(req);
  };
  return customHaders;
};

export const handleError = (error: unknown, method: string) => {
  if (error instanceof ConnectError) {
    switch (error.code) {
      case Code.Unauthenticated: {
        throw new UnauthenticatedError(
          `Authentication failed: ${error.message}`,
        );
      }
      case Code.NotFound: {
        throw new NotFoundError(`${method} not found: ${error.message}`);
      }
      case Code.InvalidArgument: {
        throw new InvalidArgumentError(`${method}: ${error.message}`);
      }
      case Code.FailedPrecondition: {
        throw new EtagMismatchError(
          `invalid etag in ${method} request: ${error.message}`,
        );
      }
      default: {
        error.message = `"${method}" failed with code: ${error.code}, message: ${error.message}`;
        throw error;
      }
    }
  } else {
    throw error;
  }
};
