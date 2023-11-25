import {
  ObjectIdentifier,
  ObjectTypeIdentifier,
  PaginationRequest,
  Relation,
  RelationIdentifier,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import { Exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v2/exporter_connect";
import { Importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v2/importer_connect";
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
  AnyMessage,
  JsonValue,
  PartialMessage,
  PlainMessage,
  Struct,
} from "@bufbuild/protobuf";
import {
  ConnectError,
  createPromiseClient,
  Interceptor,
  PromiseClient,
  StreamRequest,
  UnaryRequest,
} from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { log } from "../../log";
import { NestedOmit, PartialExcept } from "../../util/types";

type ServiceConfig = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
};

export interface DirectoryConfig {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  rejectUnauthorized?: boolean;
}

type SetRelationRequest = PartialExcept<PlainMessage<Relation>, ["hash"]>;

type SetObjectRequest = PartialExcept<
  NestedOmit<PlainMessage<SetObjectRequest$>, "object.properties"> & {
    object?: { properties?: { [key: string]: JsonValue } | Struct };
  },
  ["object.hash"]
>;

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
  ImporterClient: PromiseClient<typeof Importer>;
  ExporterClient: PromiseClient<typeof Exporter>;

  constructor(config: DirectoryConfig) {
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
      config.apiKey &&
        setHeader(req, "authorization", `basic ${config.apiKey}`);
      config.tenantId && setHeader(req, "aserto-tenant-id", config.tenantId);
      return await next(req);
    };

    const createHeadersInterceptor = (
      serviceApiKey?: string,
      serviceTenantId?: string
    ) => {
      if (
        serviceApiKey === config.apiKey &&
        serviceTenantId === config.tenantId
      ) {
        return baseServiceHeaders;
      }

      const apiKey = serviceApiKey || config.apiKey;
      const tenantId = serviceTenantId || config.tenantId;
      const headers: Interceptor = (next) => async (req) => {
        apiKey && setHeader(req, "authorization", `basic ${apiKey}`);
        tenantId && setHeader(req, "aserto-tenant-id", tenantId);
        return await next(req);
      };
      return headers;
    };

    const createTransport = (
      serviceUrl: string,
      apikey?: string,
      tenantId?: string
    ) => {
      if (
        serviceUrl !== baseServiceUrl ||
        apikey !== baseApiKey ||
        tenantId !== baseTenantId
      ) {
        return createGrpcTransport({
          httpVersion: "2",
          baseUrl: `https://${serviceUrl}`,
          interceptors: [createHeadersInterceptor(apikey, tenantId)],
          nodeOptions: { rejectUnauthorized },
        });
      }
      return baseGrpcTransport;
    };

    const baseServiceUrl = config.url ?? "directory.prod.aserto.com:8443";
    const baseApiKey = config.apiKey;
    const baseTenantId = config.tenantId;

    const readerServiceUrl = config.reader?.url || baseServiceUrl;
    const readerApiKey = config.reader?.apiKey || baseApiKey;
    const readerTenantId = config.reader?.tenantId || baseTenantId;

    const writerServiceUrl = config.writer?.url || baseServiceUrl;
    const writerApiKey = config.writer?.apiKey || baseApiKey;
    const writerTenantId = config.writer?.tenantId || baseTenantId;

    const importerServiceUrl = config.importer?.url || baseServiceUrl;
    const importerApiKey = config.importer?.apiKey || baseApiKey;
    const importerTenantId = config.importer?.tenantId || baseTenantId;

    const exporterServiceUrl = config.exporter?.url || baseServiceUrl;
    const exporterApiKey = config.exporter?.apiKey || baseApiKey;
    const exporterTenantId = config.exporter?.tenantId || baseTenantId;

    let rejectUnauthorized = true;
    if (config.rejectUnauthorized !== undefined) {
      rejectUnauthorized = config.rejectUnauthorized;
    }

    const baseGrpcTransport = createGrpcTransport({
      httpVersion: "2",
      baseUrl: `https://${baseServiceUrl}`,
      interceptors: [baseServiceHeaders],
      nodeOptions: { rejectUnauthorized },
    });

    const readerGrpcTransport = createTransport(
      readerServiceUrl,
      readerApiKey,
      readerTenantId
    );
    const writerGrpcTransport = createTransport(
      writerServiceUrl,
      writerApiKey,
      writerTenantId
    );
    const importerGrpcTransport = createTransport(
      importerServiceUrl,
      importerApiKey,
      importerTenantId
    );
    const exporterGrpcTransport = createTransport(
      exporterServiceUrl,
      exporterApiKey,
      exporterTenantId
    );

    this.ReaderClient = createPromiseClient(Reader, readerGrpcTransport);
    this.WriterClient = createPromiseClient(Writer, writerGrpcTransport);
    this.ImporterClient = createPromiseClient(Importer, importerGrpcTransport);
    this.ExporterClient = createPromiseClient(Exporter, exporterGrpcTransport);
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
    objectType: PlainMessage<ObjectTypeIdentifier>;
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
      const structProperties = Struct.fromJsonString(
        JSON.stringify(params.object?.properties || {})
      );

      const newParams: SetObjectRequest$ = new SetObjectRequest$({
        object: { ...params.object, properties: structProperties },
      });

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

export const ds = (config: DirectoryConfig): Directory => {
  log("`ds` method is deprecated, please use `DirectoryServiceV2`");
  return new Directory(config);
};

export const DirectoryServiceV2 = (config: DirectoryConfig): Directory => {
  return new Directory(config);
};
