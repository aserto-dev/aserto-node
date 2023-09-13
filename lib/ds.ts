import {
  ObjectIdentifier,
  ObjectTypeIdentifier,
  PaginationRequest,
  Relation,
  RelationIdentifier,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import { Reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_connect";
import {
  CheckPermissionRequest as CheckPermissionRequest$,
  CheckRelationRequest as CheckRelationRequest$,
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
  SetObjectRequest as SetObjectRequest$,
  SetRelationRequest as SetRelationRequest$,
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
import {
  AnyMessage,
  JsonValue,
  PlainMessage,
  Struct,
} from "@bufbuild/protobuf";

export interface Config {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  rejectUnauthorized?: boolean;
}

// https://stackoverflow.com/a/72810677
// Extend existing types to make specific fields optional.
type NestedKeys<T extends string, U extends string[]> = {
  [K in keyof U]: U[K] extends `${T}.${infer V}` ? V : never;
};
type PartialExcept<T, U extends string[]> = {
  [K in keyof T as K extends U[number] ? K : never]?: T[K];
} & {
  [K in keyof T as K extends U[number] ? never : K]: K extends string
    ? PartialExcept<T[K], NestedKeys<K, U>>
    : T[K];
};

export type SetRelationRequest = PartialExcept<
  PlainMessage<Relation>,
  ["hash"]
>;

type SetObjectRequest =
  | PartialExcept<PlainMessage<SetObjectRequest$>, ["object.hash"]>
  | { object?: { properties: { [key: string]: JsonValue } } };

type CheckPermissionRequest = PartialExcept<
  PlainMessage<CheckPermissionRequest$>,
  ["trace"]
>;

type CheckRelationRequest = PartialExcept<
  PlainMessage<CheckRelationRequest$>,
  ["trace"]
>;

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

  async checkPermission(params: CheckPermissionRequest) {
    try {
      const response = await this.ReaderClient.checkPermission(params);
      if (!response) {
        throw new Error("No response from directory service");
      }

      return response.check;
    } catch (error) {
      handleError(error, "checkPermission");
    }
  }

  async checkRelation(params: CheckRelationRequest) {
    try {
      const response = await this.ReaderClient.checkRelation(params);
      if (!response) {
        throw new Error("No response from directory service");
      }

      return response.check;
    } catch (error) {
      handleError(error, "checkRelation");
    }
  }

  async object(params: PlainMessage<ObjectIdentifier>) {
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
    objectType: ObjectTypeIdentifier;
    page?: PlainMessage<PaginationRequest>;
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

  async objectMany(params: PlainMessage<GetObjectManyRequest>) {
    try {
      const response = await this.ReaderClient.getObjectMany(params);
      if (!response) {
        throw new Error("No response from directory service");
      }

      return response.results;
    } catch (error) {
      handleError(error, "objectMany");
    }
  }

  async setObject(params: SetObjectRequest) {
    try {
      if (params && params.object) {
        params.object.properties = Struct.fromJsonString(
          JSON.stringify(params.object?.properties || {})
        );
      }

      const newParams = new SetObjectRequest$(params);
      const response = await this.WriterClient.setObject(newParams);
      if (!response) {
        throw new Error("No response from directory service");
      }

      return response.result;
    } catch (error) {
      handleError(error, "setObject");
    }
  }

  async deleteObject(params: PlainMessage<ObjectIdentifier>) {
    const deleteObjectRequest = new DeleteObjectRequest({ param: params });
    try {
      const response = await this.WriterClient.deleteObject(
        deleteObjectRequest
      );
      if (!response) {
        throw new Error("No response from directory service");
      }

      return response.result;
    } catch (error) {
      handleError(error, "deleteObject");
    }
  }

  async relation(params: PlainMessage<RelationIdentifier>) {
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

  async setRelation(params: SetRelationRequest) {
    try {
      const setRelationRequest = new SetRelationRequest$({ relation: params });

      const response = await this.WriterClient.setRelation(setRelationRequest);
      if (!response) {
        throw new Error("No response from directory service");
      }

      return response.result;
    } catch (error) {
      handleError(error, "setRelation");
    }
  }

  async deleteRelation(params: PlainMessage<RelationIdentifier>) {
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

  async relations(params: PlainMessage<RelationIdentifier>) {
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

  async graph(params: PlainMessage<GetGraphRequest>) {
    try {
      const response = await this.ReaderClient.getGraph(params);
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
