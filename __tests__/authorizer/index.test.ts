import {
  DecisionTreeResponse,
  IsResponse,
  ListPoliciesResponse,
  QueryResponse,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { Struct } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";

import { decisionTreeOptions, UnauthenticatedError } from "../../lib";
import { Authorizer } from "../../lib/authorizer";

describe("Is", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns true when policy allows access", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(new IsResponse({ decisions: [{ is: true }] }));

    const params = {
      policyContext: {
        path: "a.b.c",
        decisions: ["allowed"],
      },
      indentityContext: {},
      policyInstance: {
        name: "todo",
        instanceLabel: "todo",
      },
    };
    const result = await authorizer.Is(params);

    expect(authorizer.AuthClient.is).toHaveBeenCalledWith(params);

    expect(result).toBe(true);

    mock.mockReset();
  });

  it("returns false when policy allows access", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(new IsResponse({ decisions: [{ is: false }] }));

    const params = {
      policyContext: {
        path: "a.b.c",
        decisions: ["allowed"],
      },
      indentityContext: {},
      policyInstance: {
        name: "todo",
        instanceLabel: "todo",
      },
    };
    const result = await authorizer.Is(params);

    expect(authorizer.AuthClient.is).toHaveBeenCalledWith(params);

    expect(result).toBe(false);

    mock.mockReset();
  });

  it("handles undefined policyInstance, policyContext, and resourceContext", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(new IsResponse({ decisions: [{ is: false }] }));

    const result = await authorizer.Is({});

    expect(result).toBe(false);

    mock.mockRestore();
  });

  it("handles errors returned by the Authorizer service", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockRejectedValue(new Error("Authorizer service error"));

    await expect(authorizer.Is({})).rejects.toThrow("Authorizer service error");

    mock.mockRestore();
  });

  it("handles ConnectError", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockRejectedValue(new ConnectError("connect error", Code.Canceled));

    // error class
    await expect(authorizer.Is({})).rejects.toThrow(ConnectError);

    // error message
    await expect(authorizer.Is({})).rejects.toThrow(
      '"Is" failed with code: 1, message: "Is" failed with code: 1, message: [canceled] connect error'
    );

    mock.mockReset();
  });

  it("handles Unauthenticated Error", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockRejectedValue(
        new ConnectError("Invalid credentials", Code.Unauthenticated)
      );

    // error class
    await expect(authorizer.Is({})).rejects.toThrow(UnauthenticatedError);
    // error message
    await expect(authorizer.Is({})).rejects.toThrow(
      "Authentication failed: [unauthenticated] Invalid credentials"
    );

    mock.mockReset();
  });
});

describe("Query", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns the expected result when all parameters are valid", async () => {
    const mock = jest.spyOn(authorizer.AuthClient, "query").mockResolvedValue(
      new QueryResponse({
        response: Struct.fromJson({ key1: "value1", key2: 2 }),
      })
    );

    const result = await authorizer.Query({
      query: "query",
      input: "input",
    });

    expect(result).toEqual({ key1: "value1", key2: 2 });

    mock.mockRestore();
  });

  it("returns undefined when the response is empty", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "query")
      .mockResolvedValue(new QueryResponse({}));

    const result = await authorizer.Query({
      query: "query",
      input: "input",
    });

    expect(result).toEqual(undefined);

    mock.mockRestore();
  });
});

describe("DecisionTree", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });
  it("returns a path object and path root string when given valid inputs", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "decisionTree")
      .mockResolvedValue(
        new DecisionTreeResponse({
          pathRoot: "root",
          path: Struct.fromJson({ key1: "value1", key2: 2 }),
        })
      );

    const result = await authorizer.DecisionTree({
      options: decisionTreeOptions("SLASH"),
    });
    expect(result).toEqual({
      path: { key1: "value1", key2: 2 },
      pathRoot: "root",
    });
    mock.mockRestore();
  });

  it("returns an empty path object and path root string when no matching policy is found", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "decisionTree")
      .mockResolvedValue(new DecisionTreeResponse());

    const result = await authorizer.DecisionTree({
      options: decisionTreeOptions("SLASH"),
    });
    expect(result).toEqual({ path: undefined, pathRoot: "" });
    mock.mockRestore();
  });
});

describe("ListPolicies", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns a list of policies when given a valid policy instance", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "listPolicies")
      .mockResolvedValue(
        new ListPoliciesResponse({
          result: [
            {
              id: "1",
              packagePath: "a.b.c",
            },
          ],
        })
      );
    const result = await authorizer.ListPolicies({});
    expect(result).toEqual([
      {
        id: "1",
        packagePath: "a.b.c",
      },
    ]);
    mock.mockRestore();
  });

  it("returns an empty list when given a policy instance with no policies", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "listPolicies")
      .mockResolvedValue(
        new ListPoliciesResponse({
          result: [],
        })
      );
    const result = await authorizer.ListPolicies({});
    expect(result).toEqual([]);
    mock.mockRestore();
  });
});
