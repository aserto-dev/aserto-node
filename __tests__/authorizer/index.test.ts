import {
  DecisionTreeResponseSchema,
  IsResponseSchema,
  ListPoliciesResponseSchema,
  QueryResponseSchema,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";

import {
  decisionTreeOptions,
  queryOptions,
  UnauthenticatedError,
} from "../../lib";
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
      .mockResolvedValue(
        create(IsResponseSchema, { decisions: [{ is: true }] }),
      );

    const params = {
      policyContext: {
        path: "a.b.c",
        decisions: ["allowed"],
      },
      policyInstance: {
        name: "todo",
      },
    };
    const options = {
      headers: {
        customKey: "customValue",
      },
    };
    const result = await authorizer.Is(params, options);

    expect(authorizer.AuthClient.is).toHaveBeenCalledWith(
      {
        $typeName: "aserto.authorizer.v2.IsRequest",
        policyContext: {
          $typeName: "aserto.authorizer.v2.api.PolicyContext",
          path: "a.b.c",
          decisions: ["allowed"],
        },
        policyInstance: {
          ...params.policyInstance,
          $typeName: "aserto.authorizer.v2.api.PolicyInstance",
          instanceLabel: "todo",
        },
      },
      options,
    );

    expect(result).toBe(true);

    mock.mockReset();
  });

  it("handles resource context", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(
        create(IsResponseSchema, { decisions: [{ is: true }] }),
      );

    const params = {
      policyContext: {
        path: "a.b.c",
        decisions: ["allowed"],
      },
      policyInstance: {
        name: "todo",
      },
      resourceContext: {
        foo: "bar",
      },
    };
    const result = await authorizer.Is(params);

    expect(authorizer.AuthClient.is).toHaveBeenCalledWith(
      {
        $typeName: "aserto.authorizer.v2.IsRequest",
        policyContext: {
          $typeName: "aserto.authorizer.v2.api.PolicyContext",
          path: "a.b.c",
          decisions: ["allowed"],
        },
        resourceContext: params.resourceContext,
        policyInstance: {
          ...params.policyInstance,
          $typeName: "aserto.authorizer.v2.api.PolicyInstance",
          instanceLabel: "todo",
        },
      },
      undefined,
    );

    expect(result).toBe(true);

    mock.mockReset();
  });

  it("handles nested resource context", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(
        create(IsResponseSchema, { decisions: [{ is: true }] }),
      );

    const params = {
      policyContext: {
        path: "a.b.c",
        decisions: ["allowed"],
      },
      policyInstance: {
        name: "todo",
      },
      resourceContext: {
        foo: { bar: "baz" },
      },
    };
    const result = await authorizer.Is(params);

    expect(authorizer.AuthClient.is).toHaveBeenCalledWith(
      {
        $typeName: "aserto.authorizer.v2.IsRequest",
        policyContext: {
          $typeName: "aserto.authorizer.v2.api.PolicyContext",
          path: "a.b.c",
          decisions: ["allowed"],
        },
        resourceContext: params.resourceContext,
        policyInstance: {
          ...params.policyInstance,
          $typeName: "aserto.authorizer.v2.api.PolicyInstance",
          instanceLabel: "todo",
        },
      },
      undefined,
    );
    expect(result).toBe(true);

    mock.mockReset();
  });

  it("returns false when policy allows access", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(
        create(IsResponseSchema, { decisions: [{ is: false }] }),
      );

    const params = {
      policyContext: {
        path: "a.b.c",
        decisions: ["allowed"],
      },
      policyInstance: {
        name: "todo",
        instanceLabel: "todo",
      },
    };
    const result = await authorizer.Is(params);

    expect(authorizer.AuthClient.is).toHaveBeenCalledWith(
      {
        policyContext: {
          $typeName: "aserto.authorizer.v2.api.PolicyContext",
          path: "a.b.c",
          decisions: ["allowed"],
        },
        policyInstance: {
          $typeName: "aserto.authorizer.v2.api.PolicyInstance",
          name: "todo",
          instanceLabel: "todo",
        },
        $typeName: "aserto.authorizer.v2.IsRequest",
      },
      undefined,
    );

    expect(result).toBe(false);

    mock.mockReset();
  });

  it("handles undefined policyInstance, policyContext, and resourceContext", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockResolvedValue(
        create(IsResponseSchema, { decisions: [{ is: false }] }),
      );

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
      '"Is" failed with code: 1, message: "Is" failed with code: 1, message: [canceled] connect error',
    );

    mock.mockReset();
  });

  it("handles Unauthenticated Error", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "is")
      .mockRejectedValue(
        new ConnectError("Invalid credentials", Code.Unauthenticated),
      );

    // error class
    await expect(authorizer.Is({})).rejects.toThrow(UnauthenticatedError);
    // error message
    await expect(authorizer.Is({})).rejects.toThrow(
      "Authentication failed: [unauthenticated] Invalid credentials",
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
      create(QueryResponseSchema, {
        response: { key1: "value1", key2: 2 },
      }),
    );

    const result = await authorizer.Query({
      query: "query",
      input: '{"foo": "bar"}',
    });

    expect(result).toEqual({ key1: "value1", key2: 2 });

    mock.mockRestore();
  });

  it("returns empty object when the response is empty", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "query")
      .mockResolvedValue(create(QueryResponseSchema, {}));

    const result = await authorizer.Query({
      query: "query",
      input: "input",
    });

    expect(result).toEqual({});

    mock.mockRestore();
  });

  it("accepts queryOptions", async () => {
    const mock = jest.spyOn(authorizer.AuthClient, "query").mockResolvedValue(
      create(QueryResponseSchema, {
        response: { key1: "value1", key2: 2 },
      }),
    );

    const result = await authorizer.Query({
      query: "query",
      input: "input",
      options: queryOptions({
        metrics: true,
        trace: "FULL",
      }),
    });

    expect(authorizer.AuthClient.query).toHaveBeenCalledWith(
      {
        query: "query",
        input: "input",
        $typeName: "aserto.authorizer.v2.QueryRequest",
        options: queryOptions({
          metrics: true,
          instrument: false,
          trace: "FULL",
          traceSummary: false,
        }),
      },
      undefined,
    );

    expect(result).toEqual({ key1: "value1", key2: 2 });

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
        create(DecisionTreeResponseSchema, {
          pathRoot: "root",
          path: { key1: "value1", key2: 2 },
        }),
      );

    const result = await authorizer.DecisionTree({
      options: decisionTreeOptions("SLASH"),
    });

    expect(result).toEqual({
      path: { key1: "value1", key2: 2 },
      pathRoot: "root",
    });
    expect(result.path["key1"]).toEqual("value1");

    mock.mockRestore();
  });

  it("returns an empty path object and path root string when no matching policy is found", async () => {
    const mock = jest
      .spyOn(authorizer.AuthClient, "decisionTree")
      .mockResolvedValue(create(DecisionTreeResponseSchema));

    const result = await authorizer.DecisionTree({
      options: decisionTreeOptions("SLASH"),
    });
    expect(result).toEqual({ path: {}, pathRoot: "" });
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
        create(ListPoliciesResponseSchema, {
          result: [
            {
              id: "1",
              packagePath: "a.b.c",
            },
          ],
        }),
      );
    const result = await authorizer.ListPolicies({});
    expect(result).toEqual([
      {
        $typeName: "aserto.authorizer.v2.api.Module",
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
        create(ListPoliciesResponseSchema, {
          result: [],
        }),
      );
    const result = await authorizer.ListPolicies({});
    expect(result).toEqual([]);
    mock.mockRestore();
  });
});
