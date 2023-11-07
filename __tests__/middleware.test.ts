import dotenv from "dotenv";
import { NextFunction, Request } from "express";
import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import { Authorizer } from "../lib/authorizer";
import { Middleware } from "../lib/authorizer/middleware";

dotenv.config();

describe("Middleware", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(".Check", () => {
    it("returns without errors and call the next middleware when given a valid request with all required parameters", async () => {
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

      jest.spyOn(Authorizer.prototype, "Is").mockResolvedValue(true);

      const middleware = new Middleware({ client, policy });

      const next = jest.fn() as NextFunction;
      const res = httpMocks.createResponse();
      const response = middleware.Check(options);

      await response(request, res, next);
      expect(next).toBeCalled();

      expect(next).toHaveBeenCalled();
    });

    it("returns authorization error when not allowed", async () => {
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

      jest.spyOn(Authorizer.prototype, "Is").mockResolvedValue(false);

      const middleware = new Middleware({ client, policy });

      const next = jest.fn() as NextFunction;
      const res = httpMocks.createResponse();
      const response = middleware.Check(options);

      await response(request, res, next);
      expect(next).toBeCalledWith({
        statusCode: 403,
        error: "Forbidden",
        message: `aserto-node: Forbidden by policy examplePolicy`,
      });
    });

    it("returns error when authorizer is unavailable", async () => {
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

      jest
        .spyOn(Authorizer.prototype, "Is")
        .mockRejectedValue("Authorizer service unavailable");

      const middleware = new Middleware({ client, policy });

      const next = jest.fn() as NextFunction;
      const res = httpMocks.createResponse();
      const response = middleware.Check(options);

      await response(request, res, next);
      expect(next).toBeCalledWith({
        statusCode: 403,
        error: "Forbidden",
        message: `aserto-node: Authorizer service unavailable`,
      });
    });
  });

  describe(".Authz", () => {
    it("returns without errors and call the next middleware when given a valid request with all required parameters", async () => {
      const client = new Authorizer({});
      const policy = {
        root: "examplePolicy",
        name: "policyName",
        instanceLabel: "instanceLabel",
        decision: "allowed",
        path: "examplePath",
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

      jest.spyOn(Authorizer.prototype, "Is").mockResolvedValue(true);

      const middleware = new Middleware({ client, policy });

      const next = jest.fn() as NextFunction;
      const res = httpMocks.createResponse();
      const response = middleware.Authz();

      await response(request, res, next);
      expect(next).toBeCalled();

      expect(next).toHaveBeenCalled();
    });

    it("returns authorization error when not allowed", async () => {
      const client = new Authorizer({});
      const policy = {
        root: "examplePolicy",
        name: "policyName",
        instanceLabel: "instanceLabel",
        decision: "allowed",
        path: "examplePath",
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

      jest.spyOn(Authorizer.prototype, "Is").mockResolvedValue(false);

      const middleware = new Middleware({ client, policy });

      const next = jest.fn() as NextFunction;
      const res = httpMocks.createResponse();
      const response = middleware.Authz();

      await response(request, res, next);
      expect(next).toBeCalledWith({
        statusCode: 403,
        error: "Forbidden",
        message: `aserto-node: Forbidden by policy examplePolicy`,
      });
    });

    it("returns error when authorizer is unavailable", async () => {
      const client = new Authorizer({});
      const policy = {
        root: "examplePolicy",
        name: "policyName",
        instanceLabel: "instanceLabel",
        decision: "allowed",
        path: "examplePath",
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

      jest
        .spyOn(Authorizer.prototype, "Is")
        .mockRejectedValue("Authorizer service unavailable");

      const middleware = new Middleware({ client, policy });

      const next = jest.fn() as NextFunction;
      const res = httpMocks.createResponse();
      const response = middleware.Authz();

      await response(request, res, next);
      expect(next).toBeCalledWith({
        statusCode: 403,
        error: "Forbidden",
        message: `aserto-node: Authorizer service unavailable`,
      });
    });
  });
});
