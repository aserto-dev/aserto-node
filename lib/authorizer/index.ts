import { readFileSync } from "fs";
import { Module } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/module_pb";
import {
  Authorizer as AuthorizerClient,
  DecisionTreeRequestSchema,
  IsRequestSchema,
  QueryRequestSchema,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { create, JsonObject } from "@bufbuild/protobuf";
import {
  CallOptions,
  Client,
  createClient,
  Interceptor,
} from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { handleError, setHeader, traceMessage } from "../util/connect";
import policyInstance from "./model/policyInstance";
import {
  DecisionTreeRequest,
  IsRequest,
  ListPoliciesRequest,
  QueryRequest,
} from "./types";

type AuthorizerConfig = {
  authorizerServiceUrl?: string;
  tenantId?: string;
  authorizerApiKey?: string;
  token?: string;
  authorizerCertFile?: string;
  caFile?: string;
  insecure?: boolean;
  customHeaders?: { [key: string]: unknown };
};

type Path = {
  [key: string]: {
    [key: string]: boolean;
  };
};
export class Authorizer {
  AuthClient: Client<typeof AuthorizerClient>;
  constructor(config: AuthorizerConfig) {
    const baseServiceHeaders: Interceptor = (next) => async (req) => {
      config.token && setHeader(req, "authorization", `${config.token}`);
      config.authorizerApiKey &&
        setHeader(req, "authorization", `basic ${config.authorizerApiKey}`);
      config.tenantId && setHeader(req, "aserto-tenant-id", config.tenantId);
      return await next(req);
    };

    const interceptors = [baseServiceHeaders];
    if (process.env.NODE_TRACE_MESSAGE) {
      interceptors.push(traceMessage);
    }

    const baseServiceUrl =
      config.authorizerServiceUrl || "authorizer.prod.aserto.com:8443";
    const caFilePath = config.authorizerCertFile || config.caFile;
    const baseCaFile = !!caFilePath ? readFileSync(caFilePath) : undefined;

    const insecure = config?.insecure || false;
    const baseNodeOptions = {
      rejectUnauthorized: !insecure,
      ca: baseCaFile,
      headers: config.customHeaders,
    };

    const baseGrpcTransport = createGrpcTransport({
      baseUrl: `https://${baseServiceUrl}`,
      interceptors: interceptors,
      nodeOptions: baseNodeOptions,
    });

    this.AuthClient = createClient(AuthorizerClient, baseGrpcTransport);
  }

  async Is(params: IsRequest, options?: CallOptions): Promise<boolean> {
    try {
      const request: IsRequest$ = create(IsRequestSchema, {
        ...params,
        policyInstance:
          params.policyInstance &&
          policyInstance(params.policyInstance.name || ""),
      });
      const response = await this.AuthClient.is(request, options);

      const allowed = response.decisions[0]?.is;
      return !!allowed;
    } catch (error) {
      throw handleError(error, "Is");
    }
  }

  async Query(
    params: QueryRequest,
    options?: CallOptions,
  ): Promise<JsonObject> {
    try {
      const request: QueryRequest$ = create(QueryRequestSchema, {
        ...params,
        policyInstance:
          params.policyInstance &&
          policyInstance(params.policyInstance.name || ""),
      });

      const response = await this.AuthClient.query(request, options);
      const query: JsonObject = response.response || {};

      return query;
    } catch (error) {
      throw handleError(error, "Query");
    }
  }

  async DecisionTree(
    params: DecisionTreeRequest,
    options?: CallOptions,
  ): Promise<{
    path: Path;
    pathRoot: string;
  }> {
    try {
      const request: DecisionTreeRequest$ = create(DecisionTreeRequestSchema, {
        ...params,
        policyInstance:
          params.policyInstance &&
          policyInstance(params.policyInstance.name || ""),
      });
      const response = await this.AuthClient.decisionTree(request, options);

      return {
        path: (response.path || {}) as Path,
        pathRoot: response.pathRoot,
      };
    } catch (error) {
      throw handleError(error, "DecissionTree");
    }
  }
  async ListPolicies(
    params: ListPoliciesRequest,
    options?: CallOptions,
  ): Promise<Module[]> {
    try {
      const response = await this.AuthClient.listPolicies(params, options);

      return response.result;
    } catch (error) {
      throw handleError(error, "ListPolicies");
    }
  }
}

/**
 * Creates a new instance of the Authorizer class using the provided configuration.
 *
 * @param {AuthorizerConfig} config - The configuration object for the Authorizer.
 * @returns {Authorizer} A new Authorizer instance.
 */
export const authz = (config: AuthorizerConfig) => {
  return new Authorizer(config);
};
