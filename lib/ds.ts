import {
  ObjectIdentifier,
  ObjectTypeIdentifier,
  PaginationRequest,
  Relation,
  RelationIdentifier,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import { Reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_connect";
import {
  CheckPermissionRequest,
  CheckRelationRequest,
  GetGraphRequest,
  GetObjectManyRequest,
  GetObjectRequest,
  GetObjectsRequest,
  GetRelationRequest,
  GetRelationsRequest,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_pb";
import { Writer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v2/writer_connect";
import {
  DeleteObjectRequest,
  DeleteRelationRequest,
  SetObjectRequest,
  SetRelationRequest,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v2/writer_pb";
import {
  ConnectError,
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

export class Directory {
  ReaderClient: PromiseClient<typeof Reader>;
  WriterClient: PromiseClient<typeof Writer>;

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

    this.ReaderClient = createPromiseClient(Reader, grpcTansport);
    this.WriterClient = createPromiseClient(Writer, grpcTansport);
  }

  async checkPermission(params: PartialMessage<CheckPermissionRequest>) {
    const checkPermissionRequest = new CheckPermissionRequest(params);
    try {
      const response = await this.ReaderClient.checkPermission(
        checkPermissionRequest
      );
      return response.check;
    } catch (error) {
      handleError(error, "checkPermission");
    }
  }

  async checkRelation(params: PartialMessage<CheckRelationRequest>) {
    const checkRelationRequest = new CheckRelationRequest(params);
    try {
      const response = await this.ReaderClient.checkRelation(
        checkRelationRequest
      );
      return response.check;
    } catch (error) {
      handleError(error, "checkRelation");
    }
  }

  async object(params: PartialMessage<ObjectIdentifier>) {
    const getObjectRequest = new GetObjectRequest({ param: params });
    try {
      const response = await this.ReaderClient.getObject(getObjectRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.result;
    } catch (error) {
      handleError(error, "object");
    }
  }
  async objects(params: {
    objectType: PartialMessage<ObjectTypeIdentifier>;
    page?: PartialMessage<PaginationRequest>;
  }) {
    try {
      const getObjectsRequest = new GetObjectsRequest({
        param: params.objectType,
        page: params.page,
      });

      const response = await this.ReaderClient.getObjects(getObjectsRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response;
    } catch (error) {
      handleError(error, "objects");
    }
  }

  async objectMany(params: PartialMessage<GetObjectManyRequest>) {
    try {
      const getObjectManyRequest = new GetObjectManyRequest(params);
      const response = await this.ReaderClient.getObjectMany(
        getObjectManyRequest
      );
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.results;
    } catch (error) {
      handleError(error, "objectMany");
    }
  }

  async setObject(params: PartialMessage<SetObjectRequest>) {
    try {
      const setObjectRequest = new SetObjectRequest(params);

      const response = await this.WriterClient.setObject(setObjectRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.result;
    } catch (error) {
      handleError(error, "setObject");
    }
  }

  async deleteObject(params: PartialMessage<ObjectIdentifier>) {
    const deleteObjectRequest = new DeleteObjectRequest({ param: params });
    try {
      const response = await this.WriterClient.deleteObject(
        deleteObjectRequest
      );
      return response.result;
    } catch (error) {
      handleError(error, "deleteObject");
    }
  }

  async relation(params: PartialMessage<RelationIdentifier>) {
    const getRelationRequest = new GetRelationRequest({ param: params });
    try {
      const response = await this.ReaderClient.getRelation(getRelationRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.results;
    } catch (error) {
      handleError(error, "relation");
    }
  }

  async setRelation(params: PartialMessage<Relation>) {
    try {
      const setRelationRequest = new SetRelationRequest({ relation: params });
      const response = await this.WriterClient.setRelation(setRelationRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.result;
    } catch (error) {
      handleError(error, "setRelation");
    }
  }

  async deleteRelation(params: PartialMessage<RelationIdentifier>) {
    try {
      const deleteRelationRequest = new DeleteRelationRequest({
        param: params,
      });
      const response = await this.WriterClient.deleteRelation(
        deleteRelationRequest
      );
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.result;
    } catch (error) {
      handleError(error, "deleteRelation");
    }
  }

  async relations(params: PartialMessage<RelationIdentifier>) {
    const getRelationsRequest = new GetRelationsRequest({ param: params });
    try {
      const response = await this.ReaderClient.getRelations(
        getRelationsRequest
      );
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response;
    } catch (error) {
      handleError(error, "relations");
    }
  }

  async graph(params: PartialMessage<GetGraphRequest>) {
    try {
      const getGraphRequest = new GetGraphRequest(params);
      const response = await this.ReaderClient.getGraph(getGraphRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }
      return response.results;
    } catch (error) {
      handleError(error, "graph");
    }
  }
}

function handleError(error: unknown, method: string) {
  if (error instanceof ConnectError) {
    throw new Error(
      `"${method}" failed with code: ${error.code}, message: ${error.message}`
    );
  } else {
    throw error;
  }
}

export const ds = (config: Config): Directory => {
  return new Directory(config);
};
