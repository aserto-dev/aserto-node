import { readFileSync } from "fs";
import { Authorizer as AuthorizerClient } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_connect";
import {
  DecisionTreeRequest,
  IsRequest,
  ListPoliciesRequest,
  QueryRequest,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { AnyMessage } from "@bufbuild/protobuf";
import { PlainMessage } from "@bufbuild/protobuf";
import {
  Code,
  ConnectError,
  createPromiseClient,
  Interceptor,
  PromiseClient,
  StreamRequest,
  UnaryRequest,
} from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import {
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";

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
    const setHeader = (
      req:
        | UnaryRequest<AnyMessage, AnyMessage>
        | StreamRequest<AnyMessage, AnyMessage>,
      key: string,
      value: string
    ) => {
      req.header.get(key) === null && req.header.set(key, value);
    };

    const baseServiceHeaders: Interceptor = (next) => async (req) => {
      config.token && setHeader(req, "authorization", `${config.token}`);
      config.authorizerApiKey &&
        setHeader(req, "authorization", `basic ${config.authorizerApiKey}`);
      config.tenantId && setHeader(req, "aserto-tenant-id", config.tenantId);
      return await next(req);
    };

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
      interceptors: [baseServiceHeaders],
      nodeOptions: baseNodeOptions,
    });

    this.AuthClient = createPromiseClient(AuthorizerClient, baseGrpcTransport);
  }

  async Is(params: PlainMessage<IsRequest>) {
    try {
      const response = await this.AuthClient.is(params);

      const allowed = response.decisions[0]?.is;
      return !!allowed;
    } catch (error) {
      handleError(error, "Is");
    }
  }

  async Query(params: PlainMessage<QueryRequest>) {
    try {
      const response = await this.AuthClient.query(params);

      return response.response?.toJson();
    } catch (error) {
      handleError(error, "Query");
    }
  }

  async DecisionTree(params: PlainMessage<DecisionTreeRequest>) {
    try {
      const response = await this.AuthClient.decisionTree(params);

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

function handleError(error: unknown, method: string) {
  if (error instanceof ConnectError) {
    switch (error.code) {
      case Code.Unauthenticated: {
        throw new UnauthenticatedError(
          `Authentication failed: ${error.message}`
        );
      }
      case Code.NotFound: {
        throw new NotFoundError(`${method} not found: ${error.message}`);
      }
      case Code.InvalidArgument: {
        throw new InvalidArgumentError(`${method}: ${error.message}`);
      }

      default: {
        error.message = `"${method}" failed with code: ${error.code}, message: ${error.message}`;
        throw error;
      }
    }
  } else {
    throw error;
  }
}

export const authz = (config: AuthorizerConfig) => {
  return new Authorizer(config);
};
