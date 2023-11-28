import { readFileSync } from "fs";
import { ClientSessionOptions, SecureClientSessionOptions } from "http2";
import { PaginationRequest } from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
import { Exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_connect";
import { ExportRequest } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import { Importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_connect";
import { ImportRequest } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import { Model } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_connect";
import {
  Body,
  DeleteManifestRequest,
  GetManifestRequest,
  Metadata,
  SetManifestRequest,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import { Reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_connect";
import { GetObjectManyRequest } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import { Writer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_connect";
import { SetObjectRequest as SetObjectRequest$ } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import {
  AnyMessage,
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

import {
  CheckPermissionRequest,
  CheckRelationRequest,
  DeleteObjectRequest,
  DeleteRelationRequest,
  DirectoryV3Config,
  GetGraphRequest,
  GetObjectRequest,
  GetRelationRequest,
  GetRelationsRequest,
  ServiceConfig,
  SetObjectRequest,
  SetRelationRequest,
} from "./types";

const DATA_TYPE = {
  unknown: 0x0,
  objects: 0x8,
  relations: 0x10,
  all: 0x18,
};

type DATA_TYPE_OPTIONS = "unknown" | "objects" | "relations" | "all";

export class DirectoryV3 {
  ReaderClient: PromiseClient<typeof Reader>;
  WriterClient: PromiseClient<typeof Writer>;
  ImporterClient: PromiseClient<typeof Importer>;
  ExporterClient: PromiseClient<typeof Exporter>;
  ModelClient: PromiseClient<typeof Model>;

  constructor(config: DirectoryV3Config) {
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
      tenantId?: string,
      nodeOptions?: ClientSessionOptions | SecureClientSessionOptions
    ) => {
      if (
        serviceUrl !== baseServiceUrl ||
        apikey !== baseApiKey ||
        tenantId !== baseTenantId ||
        nodeOptions !== baseNodeOptions
      ) {
        return createGrpcTransport({
          httpVersion: "2",
          baseUrl: `https://${serviceUrl}`,
          interceptors: [createHeadersInterceptor(apikey, tenantId)],
          nodeOptions: nodeOptions,
        });
      }
      return baseGrpcTransport;
    };

    const createNodeOptions = (config?: ServiceConfig) => {
      return {
        rejectUnauthorized,
        ca: config?.caFile ? readFileSync(config.caFile) : baseCaFile,
      };
    };

    let rejectUnauthorized = true;
    if (config.rejectUnauthorized !== undefined) {
      rejectUnauthorized = config.rejectUnauthorized;
    }

    const baseServiceUrl = config.url ?? "directory.prod.aserto.com:8443";
    const baseApiKey = config.apiKey;
    const baseTenantId = config.tenantId;
    const baseCaFile = !!config.caFile
      ? readFileSync(config.caFile)
      : undefined;

    const readerServiceUrl = config.reader?.url || baseServiceUrl;
    const readerApiKey = config.reader?.apiKey || baseApiKey;
    const readerTenantId = config.reader?.tenantId || baseTenantId;
    const readerNodeOptions = createNodeOptions(config.reader);

    const writerServiceUrl = config.writer?.url || baseServiceUrl;
    const writerApiKey = config.writer?.apiKey || baseApiKey;
    const writerTenantId = config.writer?.tenantId || baseTenantId;
    const writerNodeOptions = createNodeOptions(config.writer);

    const importerServiceUrl = config.importer?.url || baseServiceUrl;
    const importerApiKey = config.importer?.apiKey || baseApiKey;
    const importerTenantId = config.importer?.tenantId || baseTenantId;
    const importerNodeOptions = createNodeOptions(config.importer);

    const exporterServiceUrl = config.exporter?.url || baseServiceUrl;
    const exporterApiKey = config.exporter?.apiKey || baseApiKey;
    const exporterTenantId = config.exporter?.tenantId || baseTenantId;
    const exporterNodeOptions = createNodeOptions(config.exporter);

    const modelServiceUrl = config.model?.url || baseServiceUrl;
    const modelApiKey = config.model?.apiKey || baseApiKey;
    const modelTenantId = config.model?.tenantId || baseTenantId;
    const modelNodeOptions = createNodeOptions(config.model);

    const baseNodeOptions = { rejectUnauthorized, ca: baseCaFile };

    const baseGrpcTransport = createGrpcTransport({
      httpVersion: "2",
      baseUrl: `https://${baseServiceUrl}`,
      interceptors: [baseServiceHeaders],
      nodeOptions: baseNodeOptions,
    });

    const readerGrpcTransport = createTransport(
      readerServiceUrl,
      readerApiKey,
      readerTenantId,
      readerNodeOptions
    );
    const writerGrpcTransport = createTransport(
      writerServiceUrl,
      writerApiKey,
      writerTenantId,
      writerNodeOptions
    );
    const importerGrpcTransport = createTransport(
      importerServiceUrl,
      importerApiKey,
      importerTenantId,
      importerNodeOptions
    );
    const exporterGrpcTransport = createTransport(
      exporterServiceUrl,
      exporterApiKey,
      exporterTenantId,
      exporterNodeOptions
    );

    const modelGrpcTransport = createTransport(
      modelServiceUrl,
      modelApiKey,
      modelTenantId,
      modelNodeOptions
    );

    this.ReaderClient = createPromiseClient(Reader, readerGrpcTransport);
    this.WriterClient = createPromiseClient(Writer, writerGrpcTransport);
    this.ImporterClient = createPromiseClient(Importer, importerGrpcTransport);
    this.ExporterClient = createPromiseClient(Exporter, exporterGrpcTransport);
    this.ModelClient = createPromiseClient(Model, modelGrpcTransport);
  }

  async checkPermission(params: CheckPermissionRequest) {
    try {
      const response = await this.ReaderClient.checkPermission(params);

      return response;
    } catch (error) {
      handleError(error, "checkPermission");
    }
  }

  async checkRelation(params: CheckRelationRequest) {
    try {
      const response = await this.ReaderClient.checkRelation(params);

      return response;
    } catch (error) {
      handleError(error, "checkRelation");
    }
  }

  async object(params: GetObjectRequest) {
    try {
      const response = await this.ReaderClient.getObject(params);

      return response.result;
    } catch (error) {
      handleError(error, "object");
    }
  }
  async objects(params: {
    objectType: string;
    page?: PartialMessage<PaginationRequest>;
  }) {
    try {
      const response = await this.ReaderClient.getObjects(params);

      return response;
    } catch (error) {
      handleError(error, "objects");
    }
  }

  async objectMany(params: PlainMessage<GetObjectManyRequest>) {
    try {
      const response = await this.ReaderClient.getObjectMany(params);

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

      return response.result;
    } catch (error) {
      handleError(error, "setObject");
    }
  }

  async deleteObject(params: DeleteObjectRequest) {
    try {
      const response = await this.WriterClient.deleteObject(params);

      return response.result;
    } catch (error) {
      handleError(error, "deleteObject");
    }
  }

  async relation(params: GetRelationRequest) {
    try {
      const response = await this.ReaderClient.getRelation(params);

      return response;
    } catch (error) {
      handleError(error, "relation");
    }
  }

  async setRelation(params: SetRelationRequest) {
    try {
      const response = await this.WriterClient.setRelation(params);

      return response.result;
    } catch (error) {
      handleError(error, "setRelation");
    }
  }

  async deleteRelation(params: DeleteRelationRequest) {
    try {
      const response = await this.WriterClient.deleteRelation(params);

      return response.result;
    } catch (error) {
      handleError(error, "deleteRelation");
    }
  }

  async relations(params: GetRelationsRequest) {
    try {
      const response = await this.ReaderClient.getRelations(params);

      return response;
    } catch (error) {
      handleError(error, "relations");
    }
  }

  async graph(params: GetGraphRequest) {
    try {
      const response = await this.ReaderClient.getGraph(params);

      return response;
    } catch (error) {
      handleError(error, "graph");
    }
  }

  async import(params: AsyncIterable<PartialMessage<ImportRequest>>) {
    try {
      return this.ImporterClient.import(params);
    } catch (error) {
      handleError(error, "import");
      return createAsyncIterable([]);
    }
  }

  async export(params: { options: DATA_TYPE_OPTIONS }) {
    try {
      return this.ExporterClient.export(
        new ExportRequest({
          options: DATA_TYPE[params.options] || DATA_TYPE["unknown"],
        })
      );
    } catch (error) {
      handleError(error, "export");
      return createAsyncIterable([]);
    }
  }

  async getManifest(params?: PlainMessage<GetManifestRequest>) {
    try {
      const response = this.ModelClient.getManifest(params!);

      const data = (await readAsyncIterable(response))
        .map((el) => el.msg)
        .map((el) => {
          return {
            [el.case as string]: el.value,
          };
        });

      const bodyData = data
        .map((el) => {
          return el["body"];
        })
        .filter((el) => el !== undefined)
        .map((el) => {
          return (el as Body)?.data;
        });

      const body = new TextDecoder().decode(mergeUint8Arrays(...bodyData));
      const metadata = data[0]?.metadata as Metadata;
      return {
        body,
        updatedAt: metadata?.updatedAt,
        etag: metadata?.etag,
      };
    } catch (error) {
      handleError(error, "getManifest");
    }
  }

  async setManifest(params: { body: string }) {
    try {
      const response = await this.ModelClient.setManifest(
        createAsyncIterable([
          new SetManifestRequest({
            msg: {
              case: "body",
              value: { data: new TextEncoder().encode(params.body) },
            },
          }),
        ])
      );

      return response;
    } catch (error) {
      handleError(error, "setManifest");
    }
  }

  async deleteManifest(params?: PlainMessage<DeleteManifestRequest>) {
    try {
      const response = this.ModelClient.deleteManifest(params!);

      return response;
    } catch (error) {
      handleError(error, "deleteManifest");
    }
  }
}

/**
 * Read an asynchronous iterable into an array.
 */
export async function readAsyncIterable<T>(
  gen: AsyncIterable<T>
): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
  }
  return out;
}

/**
 * Create an asynchronous iterable from an array.
 */
export async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  yield* items;
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

function mergeUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalSize = arrays.reduce((acc, e) => acc + e.length, 0);
  const merged = new Uint8Array(totalSize);

  arrays.forEach((array, i, arrays) => {
    const offset = arrays.slice(0, i).reduce((acc, e) => acc + e.length, 0);
    merged.set(array, offset);
  });

  return merged;
}

export const DirectoryServiceV3 = (config: DirectoryV3Config): DirectoryV3 => {
  return new DirectoryV3(config);
};
