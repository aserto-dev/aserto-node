import { NextFunction, Response } from "express";

import { log } from "./log";

const errorHandler =
  (next: NextFunction, failWithError: boolean) =>
  (res: Response, err_message = "express-jwt-aserto: unknown error") => {
    {
      if (failWithError) {
        return next({
          statusCode: 403,
          error: "Forbidden",
          message: `express-jwt-aserto: ${err_message}`,
        });
      }
      log(err_message, "ERROR");
      res.append(
        "WWW-Authenticate",
        `Bearer error="${encodeURIComponent(err_message)}"`
      );
      res.status(403).send(err_message);
    }
  };

export { errorHandler };
