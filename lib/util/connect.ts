import { DescMessage } from "@bufbuild/protobuf";
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
import Logger from "../log";

export const setHeader = (
  req:
    | StreamRequest<DescMessage, DescMessage>
    | UnaryRequest<DescMessage, DescMessage>,
  key: string,
  value: string,
) => {
  req.header.get(key) === null && req.header.set(key, value);
};

export const traceMessage = (logger: Logger): Interceptor => {
  const tracer: Interceptor = (next) => async (req) => {
    logger.debug({
      message: req.message.toString(),
      method: req.method.toString(),
      requestMethod: req.requestMethod.toString(),
      service: req.service.toString(),
      url: req.url.toString(),
    });
    return await next(req);
  };

  return tracer;
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
      case Code.FailedPrecondition: {
        return new EtagMismatchError(
          `invalid etag in ${method} request: ${error.message}`,
        );
      }
      case Code.InvalidArgument: {
        return new InvalidArgumentError(`${method}: ${error.message}`);
      }
      case Code.NotFound: {
        return new NotFoundError(`${method} not found: ${error.message}`);
      }
      case Code.Unauthenticated: {
        return new UnauthenticatedError(
          `Authentication failed: ${error.message}`,
        );
      }
      default: {
        error.message = `"${method}" failed with code: ${error.code}, message: ${error.message}`;
        return error;
      }
    }
  } else {
    throw error;
  }
};
