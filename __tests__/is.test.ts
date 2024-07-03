import dotenv from "dotenv";
import { Request } from "express";
import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import { Authorizer } from "../lib/authorizer";
import { is } from "../lib/is";

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

  it("returns a boolean when all required arguments, packageName, and resourceMap are provided as inputs", async () => {
    const decision = "allowed";
    const req: Request = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const packageName = "GET.todos";
    const resourceMap = { id: "value-of-id" };

    const options = {
      policyRoot: "todoApp",
      policyId: "123",
      authorizerServiceUrl: "localhost:8282",
      identityHeader: "Authorization",
      caFile: process.env.CA_FILE!,
    };

    const allowed = await is(decision, req, options, packageName, resourceMap);

    expect(allowed).toBe(true);
  });

  it("returns a boolean when all required arguments are provided as inputs and req object is populated", async () => {
    const decision = "allowed";

    const req: Request = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
      params: { id: "value-of-id" },
      method: "GET",
      route: {
        path: "/todos",
      },
    });

    const options = {
      policyRoot: "todoApp",
      policyId: "123",
      authorizerServiceUrl: "localhost:8282",
      identityHeader: "Authorization",
      caFile: process.env.CA_FILE!,
    };

    const allowed = await is(decision, req, options);

    expect(allowed).toBe(true);
  });
});
