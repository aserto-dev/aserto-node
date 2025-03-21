import { NextFunction, Response } from "express";

import { defaultLogger } from "./log";

const errorHandler =
  (next: NextFunction, failWithError: boolean) =>
  (res: Response, err_message = "aserto-node: unknown error") => {
    {
      if (failWithError) {
        return next({
          statusCode: 403,
          error: "Forbidden",
          message: `aserto-node: ${err_message}`,
        });
      }
      defaultLogger.error(err_message);
      res.append(
        "WWW-Authenticate",
        `Bearer error="${encodeURIComponent(err_message)}"`,
      );
      res.status(403).send(err_message);
    }
  };

export { errorHandler };
