import { readFileSync } from "fs";
import { Module } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/module_pb";
import { Authorizer as AuthorizerClient } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_connect";
import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  ListPoliciesRequest,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { JsonObject, PlainMessage, Struct } from "@bufbuild/protobuf";
import {
  createPromiseClient,
  Interceptor,
  PromiseClient,
} from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { handleError, setHeader, traceMessage } from "../util/connect";
import policyInstance from "./model/policyInstance";
import { DecisionTreeRequest, IsRequest, QueryRequest } from "./type";

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
  AuthClient: PromiseClient<typeof AuthorizerClient>;
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
      httpVersion: "2",
      baseUrl: `https://${baseServiceUrl}`,
      interceptors: interceptors,
      nodeOptions: baseNodeOptions,
    });

    this.AuthClient = createPromiseClient(AuthorizerClient, baseGrpcTransport);
  }

  async Is(params: IsRequest): Promise<boolean> {
    try {
      const request: IsRequest$ = new IsRequest$({
        ...params,
        resourceContext: params.resourceContext
          ? Struct.fromJson(params.resourceContext)
          : undefined,
        policyInstance:
          params.policyInstance &&
          policyInstance(params.policyInstance.name || ""),
      });
      const response = await this.AuthClient.is(request);

      const allowed = response.decisions[0]?.is;
      return !!allowed;
    } catch (error) {
      handleError(error, "Is");
      return false;
    }
  }

  async Query(params: QueryRequest): Promise<JsonObject> {
    try {
      const request: QueryRequest$ = new QueryRequest$({
        ...params,
        resourceContext: params.resourceContext
          ? Struct.fromJson(params.resourceContext)
          : undefined,
        policyInstance:
          params.policyInstance &&
          policyInstance(params.policyInstance.name || ""),
      });

      const response = await this.AuthClient.query(request);
      const query: JsonObject = JSON.parse(
        response.response?.toJsonString() || "{}",
      );

      return query;
    } catch (error) {
      handleError(error, "Query");
      return {};
    }
  }

  async DecisionTree(params: DecisionTreeRequest): Promise<{
    path: Path;
    pathRoot: string;
  }> {
    try {
      const request: DecisionTreeRequest$ = new DecisionTreeRequest$({
        ...params,
        resourceContext: params.resourceContext
          ? Struct.fromJson(params.resourceContext)
          : undefined,
        policyInstance:
          params.policyInstance &&
          policyInstance(params.policyInstance.name || ""),
      });
      const response = await this.AuthClient.decisionTree(request);

      return {
        path: JSON.parse(response.path?.toJsonString() || "{}"),
        pathRoot: response.pathRoot,
      };
    } catch (error) {
      handleError(error, "DecissionTree");
      return {
        path: {},
        pathRoot: "",
      };
    }
  }
  async ListPolicies(
    params: PlainMessage<ListPoliciesRequest>,
  ): Promise<Module[]> {
    try {
      const response = await this.AuthClient.listPolicies(params);

      return response.result;
    } catch (error) {
      handleError(error, "ListPolicies");
      return [];
    }
  }
}

export const authz = (config: AuthorizerConfig) => {
  return new Authorizer(config);
};
