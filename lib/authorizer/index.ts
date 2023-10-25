import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";
import { Module } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/module_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";
import { AuthorizerClient } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb";
import {
  DecisionTreeOptions,
  DecisionTreeRequest,
  DecisionTreeResponse,
  IsRequest,
  IsResponse,
  ListPoliciesRequest,
  ListPoliciesResponse,
  QueryRequest,
  QueryResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import {
  ChannelCredentials,
  credentials,
  Metadata,
  ServiceError,
} from "@grpc/grpc-js";

import buildDecisionTreeOptions from "./model/decisionTreeOptions";
import buildPolicyContext from "./model/policyContext";
import { ResourceContext } from "./model/resourceContext";

interface AuthorizerConfig {
  authorizerServiceUrl?: string;
  tenantId?: string;
  authorizerApiKey?: string;
  authorizerCertFile?: string;
}
export class Authorizer {
  Client: AuthorizerClient;
  Metadata: Metadata;
  constructor(
    config: AuthorizerConfig,
    channelCredentials: ChannelCredentials = credentials.createSsl()
  ) {
    const url =
      config.authorizerServiceUrl ?? "authorizer.prod.aserto.com:8443";

    const metadata = new Metadata();
    config.authorizerApiKey &&
      metadata.add("authorization", `basic ${config.authorizerApiKey}`);
    config.tenantId && metadata.add("aserto-tenant-id", config.tenantId);

    this.Metadata = metadata;
    this.Client = new AuthorizerClient(url, channelCredentials);
  }

  async Is({
    identityContext,
    policyInstance,
    policyContext = buildPolicyContext(),
    resourceContext = {},
  }: {
    identityContext: IdentityContext;
    policyInstance?: PolicyInstance;
    policyContext?: PolicyContext;
    resourceContext?: ResourceContext;
  }): Promise<boolean> {
    const request = new IsRequest();

    policyInstance && request.setPolicyInstance(policyInstance);
    request.setIdentityContext(identityContext);
    request.setPolicyContext(policyContext);
    request.setResourceContext(Struct.fromJavaScript(resourceContext));

    return new Promise((resolve, reject) => {
      try {
        this.Client.is(
          request,
          this.Metadata,
          (err: ServiceError, response: IsResponse) => {
            if (err) {
              const message = `'is' returned error: ${err.message}`;
              reject(message);
              return;
            }

            if (!response) {
              const message = `'is' returned error: No response`;
              reject(message);
              return;
            }

            const result = response.getDecisionsList();
            const allowed = result && result.length && result[0]?.getIs();

            resolve(!!allowed);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
  async Query({
    identityContext,
    policyInstance,
    policyContext = buildPolicyContext(),
    resourceContext = {},
    query,
  }: {
    identityContext: IdentityContext;
    policyInstance?: PolicyInstance;
    policyContext?: PolicyContext;
    resourceContext?: ResourceContext;
    query: string;
  }): Promise<{ [key: string]: JavaScriptValue } | undefined> {
    const request = new QueryRequest();
    policyInstance && request.setPolicyInstance(policyInstance);
    request.setIdentityContext(identityContext);
    request.setPolicyContext(policyContext);
    request.setResourceContext(Struct.fromJavaScript(resourceContext));
    request.setQuery(query);

    return new Promise((resolve, reject) => {
      try {
        this.Client.query(
          request,
          this.Metadata,
          (err: ServiceError, response: QueryResponse) => {
            if (err) {
              const message = `'query' returned error: ${err.message}`;
              reject(message);
              return;
            }

            if (!response) {
              const message = `'query' returned error: No response`;
              reject(message);
              return;
            }

            const result = response.getResponse();
            resolve(result?.toJavaScript());
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async DecisionTree({
    identityContext,
    policyInstance,
    policyContext = buildPolicyContext(),
    resourceContext = {},
    decisionTreeOptions = buildDecisionTreeOptions("PATH_SEPARATOR_DOT"),
  }: {
    identityContext: IdentityContext;
    policyInstance?: PolicyInstance;
    policyContext?: PolicyContext;
    resourceContext?: ResourceContext;
    decisionTreeOptions?: DecisionTreeOptions;
  }): Promise<{
    path:
      | {
          [key: string]: JavaScriptValue;
        }
      | undefined;
    pathRoot: string;
  }> {
    const request = new DecisionTreeRequest();
    policyInstance && request.setPolicyInstance(policyInstance);
    request.setIdentityContext(identityContext);
    request.setPolicyContext(policyContext);
    request.setResourceContext(Struct.fromJavaScript(resourceContext));
    request.setOptions(decisionTreeOptions);

    return new Promise((resolve, reject) => {
      try {
        this.Client.decisionTree(
          request,
          this.Metadata,
          (err: ServiceError, response: DecisionTreeResponse) => {
            if (err) {
              const message = `'decisionTree' returned error: ${err.message}`;
              reject(message);
              return;
            }

            if (!response) {
              const message = `'decisionTree' returned error: No response`;
              reject(message);
              return;
            }

            const result = {
              path: response.getPath()?.toJavaScript(),
              pathRoot: response.getPathRoot(),
            };
            resolve(result);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async ListPolicies({
    policyInstance,
  }: {
    policyInstance: PolicyInstance;
  }): Promise<Module.AsObject[]> {
    const request = new ListPoliciesRequest();
    request.setPolicyInstance(policyInstance);

    return new Promise((resolve, reject) => {
      try {
        this.Client.listPolicies(
          request,
          this.Metadata,
          (err: ServiceError, response: ListPoliciesResponse) => {
            if (err) {
              const message = `'listPolicies' returned error: ${err.message}`;
              reject(message);
              return;
            }

            if (!response) {
              const message = `'listPolicies' returned error: No response`;
              reject(message);
              return;
            }

            const result = response.toObject();

            resolve(result.resultList);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const authz = (
  config: AuthorizerConfig,
  channel?: ChannelCredentials
): Authorizer => {
  return new Authorizer(config, channel);
};
