import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import { Authorizer } from "../lib/authorizer";
import { jwtAuthz } from "../lib/jwtAuthz";

dotenv.config();

describe("should succeed", () => {
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

  it("returns a boolean when all required arguments, packageName, and resourceMap are provided as inputs", async () => {
    const options = {
      policyRoot: "todoApp",
      policyName: "todoApp",
      policyId: "123",
      authorizerServiceUrl: "localhost:8282",
      identityHeader: "Authorization",
      authorizerCertCAFile: process.env.CA_FILE!,
    };

    const next = jest.fn() as NextFunction;
    const res: Response = httpMocks.createResponse();
    const response = jwtAuthz(options);

    await response(request, res, next);
    expect(next).toBeCalled();
  });
});
