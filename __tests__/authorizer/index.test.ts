import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";
import { Module } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/module_pb";
import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";
import {
  Decision,
  DecisionTreeResponse,
  IsResponse,
  ListPoliciesResponse,
  QueryResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";

import { Authorizer } from "../../lib/authorizer";
import buildDecisionTreeOptions from "../../lib/authorizer/model/decisionTreeOptions";
import buildPolicyContext from "../../lib/authorizer/model/policyContext";

describe("Is", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns true when policy allows access", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};

    const mockIs = jest
      .spyOn(authorizer.client, "is")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new IsResponse();
        const decision = new Decision();
        decision.setIs(true);
        response.setDecisionsList([decision]);
        callback(null, response);
      });

    const result = await authorizer.Is({
      identityContext,
      policyInstance,
      policyContext,
      resourceContext,
    });

    expect(result).toBe(true);

    mockIs.mockRestore();
  });

  it("returns false when policy denies access", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};

    const mockIs = jest
      .spyOn(authorizer.client, "is")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new IsResponse();
        const decision = new Decision();
        decision.setIs(false);
        response.setDecisionsList([decision]);
        callback(null, response);
      });

    const result = await authorizer.Is({
      identityContext,
      policyInstance,
      policyContext,
      resourceContext,
    });

    expect(result).toBe(false);

    mockIs.mockRestore();
  });

  it("handles undefined policyInstance, policyContext, and resourceContext", async () => {
    const identityContext = new IdentityContext();

    const mockIs = jest
      .spyOn(authorizer.client, "is")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new IsResponse();
        const decision = new Decision();
        decision.setIs(true);
        response.setDecisionsList([decision]);
        callback(null, response);
      });

    const result = await authorizer.Is({
      identityContext,
    });

    expect(result).toBe(true);

    mockIs.mockRestore();
  });

  it("throws an error when grpc call fails", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};

    const mockIs = jest
      .spyOn(authorizer.client, "is")
      .mockImplementation((_request, _metadata, callback) => {
        callback(new Error("grpc call failed"));
      });

    await expect(
      authorizer.Is({
        identityContext,
        policyInstance,
        policyContext,
        resourceContext,
      })
    ).rejects.toEqual("'is' returned error: grpc call failed");

    mockIs.mockRestore();
  });

  it("throws an error when response is undefined", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};

    const mockIs = jest
      .spyOn(authorizer.client, "is")
      .mockImplementation((_request, _metadata, callback) => {
        callback(null, undefined);
      });

    await expect(
      authorizer.Is({
        identityContext,
        policyInstance,
        policyContext,
        resourceContext,
      })
    ).rejects.toEqual("'is' returned error: No response");

    mockIs.mockRestore();
  });
});

describe("Query", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns the expected result when all parameters are valid", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};
    const query = "example query";

    const mockQuery = jest
      .spyOn(authorizer.client, "query")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new QueryResponse();
        const result = Struct.fromJavaScript({
          key1: "value1",
          key2: 2,
        });

        response.setResponse(result);
        callback(null, response);
      });

    const result = await authorizer.Query({
      identityContext,
      policyInstance,
      policyContext,
      resourceContext,
      query,
    });

    expect(result).toEqual({ key1: "value1", key2: 2 });

    mockQuery.mockRestore();
  });

  it("returns undefined when the response is empty", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};
    const query = "example query";

    const mockQuery = jest
      .spyOn(authorizer.client, "query")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new QueryResponse();
        callback(null, response);
      });

    const result = await authorizer.Query({
      identityContext,
      policyInstance,
      policyContext,
      resourceContext,
      query,
    });

    expect(result).toBeUndefined();

    mockQuery.mockRestore();
  });
});

describe("DecisionTree", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns a path object and path root string when given valid inputs", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};
    const decisionTreeOptions = buildDecisionTreeOptions("PATH_SEPARATOR_DOT");

    const mockDecisionTree = jest
      .spyOn(authorizer.client, "decisionTree")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new DecisionTreeResponse();
        const path = Struct.fromJavaScript({ key1: "value1", key2: 2 });
        response.setPath(path);
        response.setPathRoot("root");
        callback(null, response);
      });

    const result = await authorizer.DecisionTree({
      identityContext,
      policyInstance,
      policyContext,
      resourceContext,
      decisionTreeOptions,
    });

    expect(result).toEqual({
      path: { key1: "value1", key2: 2 },
      pathRoot: "root",
    });

    mockDecisionTree.mockRestore();
  });

  it("returns an empty path object and path root string when no matching policy is found", async () => {
    const identityContext = new IdentityContext();
    const policyInstance = new PolicyInstance();
    const policyContext = buildPolicyContext();
    const resourceContext = {};
    const decisionTreeOptions = buildDecisionTreeOptions("PATH_SEPARATOR_DOT");

    const mockDecisionTree = jest
      .spyOn(authorizer.client, "decisionTree")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new DecisionTreeResponse();
        callback(null, response);
      });

    const result = await authorizer.DecisionTree({
      identityContext,
      policyInstance,
      policyContext,
      resourceContext,
      decisionTreeOptions,
    });

    expect(result).toEqual({ path: undefined, pathRoot: "" });

    mockDecisionTree.mockRestore();
  });

  it("returns an empty path object and path root string when policyInstance is not provided", async () => {
    const identityContext = new IdentityContext();
    const policyContext = buildPolicyContext();
    const resourceContext = {};
    const decisionTreeOptions = buildDecisionTreeOptions("PATH_SEPARATOR_DOT");

    const mockDecisionTree = jest
      .spyOn(authorizer.client, "decisionTree")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new DecisionTreeResponse();
        callback(null, response);
      });

    const result = await authorizer.DecisionTree({
      identityContext,
      policyContext,
      resourceContext,
      decisionTreeOptions,
    });

    expect(result).toEqual({ path: undefined, pathRoot: "" });

    mockDecisionTree.mockRestore();
  });
});

describe("ListPolicies", () => {
  const authorizer = new Authorizer({
    authorizerServiceUrl: "example.com",
    tenantId: "tenantId",
    authorizerApiKey: "apiKey",
  });

  it("returns a list of policies when given a valid policy instance", async () => {
    const policyInstance = new PolicyInstance();
    const module = new Module();
    module.setPackagePath("test");
    const expectedResult = [module.toObject()];
    const mockedResult: Module[] = [module];

    const mockListPolicies = jest
      .spyOn(authorizer.client, "listPolicies")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new ListPoliciesResponse();
        response.setResultList(mockedResult);
        callback(null, response);
      });

    const result = await authorizer.ListPolicies({ policyInstance });

    expect(result).toEqual(expectedResult);

    mockListPolicies.mockRestore();
  });

  it("returns an empty list when given a policy instance with no policies", async () => {
    const policyInstance = new PolicyInstance();
    const expectedResult: Module[] = [];

    const mockListPolicies = jest
      .spyOn(authorizer.client, "listPolicies")
      .mockImplementation((_request, _metadata, callback) => {
        const response = new ListPoliciesResponse();
        response.setResultList(expectedResult);
        callback(null, response);
      });

    const result = await authorizer.ListPolicies({ policyInstance });

    expect(result).toEqual(expectedResult);

    mockListPolicies.mockRestore();
  });
});
