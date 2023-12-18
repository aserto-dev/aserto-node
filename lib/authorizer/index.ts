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
  QueryOptions,
  QueryRequest,
  QueryResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import {
  ChannelCredentials,
  credentials,
  InterceptingCall,
  Metadata,
  ServiceError,
} from "@grpc/grpc-js";
import {
  InterceptorOptions,
  NextCall,
} from "@grpc/grpc-js/build/src/client-interceptors";

import { log } from "../log";
import buildDecisionTreeOptions from "./model/decisionTreeOptions";
import buildPolicyContext from "./model/policyContext";
import buildQueryOptions from "./model/queryOptions";
import { ResourceContext } from "./model/resourceContext";

type Path = {
  [key: string]: {
    [key: string]: boolean;
  };
};

type AuthorizerConfig = {
  authorizerServiceUrl?: string;
  tenantId?: string;
  authorizerApiKey?: string;
  authorizerCertFile?: string;
};
export class Authorizer {
  client: AuthorizerClient;
  metadata: Metadata;
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
    const interceptors = [];
    if (process.env.NODE_TRACE_MESSAGE) {
      const interceptor = function (
        options: InterceptorOptions,
        nextCall: NextCall
      ) {
        return new InterceptingCall(nextCall(options), {
          sendMessage: function (message, next) {
            log(JSON.stringify(message.toObject()));
            next(message);
          },
        });
      };
      interceptors.push(interceptor);
    }
    this.metadata = metadata;
    this.client = new AuthorizerClient(url, channelCredentials, {
      interceptors: interceptors,
    });
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
        this.client.is(
          request,
          this.metadata,
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
    query,
    policyInstance,
    policyContext = buildPolicyContext(),
    resourceContext = {},
    queryOptions = buildQueryOptions(),
  }: {
    identityContext: IdentityContext;
    query: string;
    policyInstance?: PolicyInstance;
    policyContext?: PolicyContext;
    resourceContext?: ResourceContext;
    queryOptions?: QueryOptions;
  }): Promise<{ [key: string]: JavaScriptValue } | undefined> {
    const request = new QueryRequest();
    policyInstance && request.setPolicyInstance(policyInstance);
    request.setIdentityContext(identityContext);
    request.setPolicyContext(policyContext);
    request.setResourceContext(Struct.fromJavaScript(resourceContext));
    request.setQuery(query);
    request.setOptions(queryOptions);

    return new Promise((resolve, reject) => {
      try {
        this.client.query(
          request,
          this.metadata,
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
    path: Path;
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
        this.client.decisionTree(
          request,
          this.metadata,
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
              path: response.getPath()?.toJavaScript() as Path,
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
        this.client.listPolicies(
          request,
          this.metadata,
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
