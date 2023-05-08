import {
  RelationIdentifier,
  RelationTypeIdentifier,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import { ObjectIdentifier } from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import { Reader as ReaderClient } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_connect";
import {
  GetObjectRequest,
  GetRelationRequest,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_pb";
import {
  createPromiseClient,
  Interceptor,
  PromiseClient,
  StreamRequest,
  UnaryRequest,
} from "@bufbuild/connect";
import { createGrpcTransport } from "@bufbuild/connect-node";
import { AnyMessage, PartialMessage } from "@bufbuild/protobuf";

export interface Config {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  rejectUnauthorized?: boolean;
}

const validateGetRelationParams = (
  params: PartialMessage<RelationIdentifier>
) => {
  validateObjectRef(params.object!, "object");
  validateObjectType(params.subject!, "subject");
  validateRelationRef(params.relation!);
};

const validateObjectRef = (
  ref: PartialMessage<ObjectIdentifier>,
  side: "subject" | "object"
) => {
  if (!ref.type || !ref.key) {
    throw new Error(
      `Either ${side} id or ${side} type and ${side} key must be provided`
    );
  }
};

const validateObjectType = (
  ref: PartialMessage<ObjectIdentifier>,
  side: "subject" | "object"
) => {
  if (!ref.type) {
    throw new Error(`Either ${side} id or ${side} type must be provided`);
  }
};

const validateRelationRef = (ref: PartialMessage<RelationTypeIdentifier>) => {
  if (!ref.objectType || !ref.name) {
    throw new Error(
      "Either relation id or relation object type and relation name must be provided"
    );
  }
};

export class Directory {
  ReaderClient: PromiseClient<typeof ReaderClient>;

  constructor(config: Config) {
    const setHeader = (
      req:
        | UnaryRequest<AnyMessage, AnyMessage>
        | StreamRequest<AnyMessage, AnyMessage>,
      key: string,
      value: string
    ) => {
      req.header.get(key) === null && req.header.set(key, value);
    };

    const headers: Interceptor = (next) => async (req) => {
      config.apiKey &&
        setHeader(req, "authorization", `basic ${config.apiKey}`);
      config.tenantId && setHeader(req, "aserto-tenant-id", config.tenantId);
      return await next(req);
    };

    const url = config.url ?? "directory.prod.aserto.com:8443";

    let rejectUnauthorized = true;
    if (config.rejectUnauthorized !== undefined) {
      rejectUnauthorized = config.rejectUnauthorized;
    }

    const grpcTansport = createGrpcTransport({
      httpVersion: "2",
      baseUrl: `https://${url}`,
      interceptors: [headers],
      nodeOptions: { rejectUnauthorized },
    });

    this.ReaderClient = createPromiseClient(ReaderClient, grpcTansport);
  }

  async object(params: PartialMessage<ObjectIdentifier>) {
    if (params.key && !params.type) {
      throw Error("You must provide an object type");
    }

    const getObjectRequest = new GetObjectRequest({ param: params });
    try {
      const response = await this.ReaderClient.getObject(getObjectRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.result;
    } catch (error) {
      throw error;
    }
  }

  async relation(params: PartialMessage<RelationIdentifier>) {
    validateGetRelationParams(params);

    const getRelationRequest = new GetRelationRequest({ param: params });
    try {
      const response = await this.ReaderClient.getRelation(getRelationRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.results;
    } catch (error) {
      throw error;
    }
  }
}

export const ds = (config: Config): Directory => {
  return new Directory(config);
};
