import { readFileSync } from "fs";
import { Authorizer as AuthorizerClient } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_connect";
import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  ListPoliciesRequest,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { PlainMessage, Struct } from "@bufbuild/protobuf";
import {
  createPromiseClient,
  Interceptor,
  PromiseClient,
} from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { handleError, setHeader, traceMessage } from "../util/connect";
import { DecisionTreeRequest, IsRequest, QueryRequest } from "./type";

type AuthorizerConfig = {
  authorizerServiceUrl?: string;
  tenantId?: string;
  authorizerApiKey?: string;
  token?: string;
  authorizerCertFile?: string;
  insecure?: boolean;
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
    const baseCaFile = !!config.authorizerCertFile
      ? readFileSync(config.authorizerCertFile)
      : undefined;

    const insecure = config?.insecure || false;
    const baseNodeOptions = {
      rejectUnauthorized: !insecure,
      ca: baseCaFile,
    };

    const baseGrpcTransport = createGrpcTransport({
      httpVersion: "2",
      baseUrl: `https://${baseServiceUrl}`,
      interceptors: interceptors,
      nodeOptions: baseNodeOptions,
    });

    this.AuthClient = createPromiseClient(AuthorizerClient, baseGrpcTransport);
  }

  async Is(params: IsRequest) {
    try {
      const request: IsRequest$ = new IsRequest$({
        ...params,
        resourceContext: params.resourceContext
          ? Struct.fromJson(params.resourceContext)
          : undefined,
      });
      const response = await this.AuthClient.is(request);

      const allowed = response.decisions[0]?.is;
      return !!allowed;
    } catch (error) {
      handleError(error, "Is");
    }
  }

  async Query(params: QueryRequest) {
    try {
      const request: QueryRequest$ = new QueryRequest$({
        ...params,
        resourceContext: params.resourceContext
          ? Struct.fromJson(params.resourceContext)
          : undefined,
      });

      const response = await this.AuthClient.query(request);

      return response.response?.toJson();
    } catch (error) {
      handleError(error, "Query");
    }
  }

  async DecisionTree(params: DecisionTreeRequest) {
    try {
      const request: DecisionTreeRequest$ = new DecisionTreeRequest$({
        ...params,
        resourceContext: params.resourceContext
          ? Struct.fromJson(params.resourceContext)
          : undefined,
      });
      const response = await this.AuthClient.decisionTree(request);

      return {
        path: response.path?.toJson(),
        pathRoot: response.pathRoot,
      };
    } catch (error) {
      handleError(error, "DecissionTree");
    }
  }
  async ListPolicies(params: PlainMessage<ListPoliciesRequest>) {
    try {
      const response = await this.AuthClient.listPolicies(params);

      return response.result;
    } catch (error) {
      handleError(error, "ListPolicies");
    }
  }
}

export const authz = (config: AuthorizerConfig) => {
  return new Authorizer(config);
};
