import dotenv from "dotenv";
import { NextFunction, Request } from "express";
import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import { Authorizer } from "../lib/authorizer";
import { Middleware } from "../lib/authorizer/middleware";

dotenv.config();

describe("Middleware", () => {
  beforeEach(() => {
    jest.spyOn(Authorizer.prototype, "Is").mockImplementation(() => {
      return new Promise((resolve) => {
        resolve(true);
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return without errors and call the next middleware when given a valid request with all required parameters", async () => {
    // Mock dependencies
    const client = new Authorizer({});
    const policy = {
      root: "examplePolicy",
      name: "policyName",
      instanceLabel: "instanceLabel",
      decision: "allowed",
      path: "examplePath",
    };
    const options = {
      object: {
        id: "objectId",
        type: "objectType",
      },
      relation: {
        name: "relationName",
      },
      subject: {
        type: "subjectType",
      },
    };

    const jwt = nJwt.create({}, "signingKey");

    const request: Request = httpMocks.createRequest({
      method: "GET",
      route: {
        path: "/todos",
      },
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    // Initialize middleware
    const middleware = new Middleware({ client, policy });

    // Invoke Check middleware
    const next = jest.fn() as NextFunction;
    const res = httpMocks.createResponse();
    const response = middleware.Check(options);

    await response(request, res, next);
    expect(next).toBeCalled();

    // Expectations
    expect(next).toHaveBeenCalled();
  });
});
