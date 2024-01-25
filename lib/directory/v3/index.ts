import { readFileSync } from "fs";
import { PaginationRequest } from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
import { Exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_connect";
import {
  ExportRequest,
  Option,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
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
  EtagMismatchError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";
import {
  nullExporterProxy,
  nullImporterProxy,
  nullModelProxy,
  nullReaderProxy,
  nullWriterProxy,
} from "./null";
import {
  CheckPermissionRequest,
  CheckRelationRequest,
  CheckRequest,
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

/**
 * "UNKNOWN" - nothing selected (default initialization value)
 *
 * "DATA_OBJECTS" - object instances
 *
 * "DATA_RELATIONS" - relation instances
 *
 * "DATA" - all data = OPTION_DATA_OBJECTS | OPTION_DATA_RELATIONS
 *
 */
type DATA_TYPE_OPTIONS = keyof typeof Option;

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
      config.token && setHeader(req, "authorization", `${config.token}`);
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

    const validConfig = (
      config: ServiceConfig | undefined,
      fallback: ServiceConfig | undefined
    ) => {
      return (
        !!config?.url ||
        !!fallback?.url ||
        ((!!config?.apiKey || !!fallback?.apiKey) &&
          (config?.tenantId || !!fallback?.tenantId))
      );
    };

    const createTransport = (
      config: ServiceConfig | undefined,
      fallback: ServiceConfig | undefined
    ) => {
      if (!validConfig(config, fallback)) {
        return;
      }

      const serviceUrl = config?.url || fallback?.url;
      const apiKey = config?.apiKey || fallback?.apiKey;
      const tenantId = config?.tenantId || fallback?.tenantId;
      const nodeOptions = createNodeOptions(config);

      if (
        serviceUrl !== baseServiceUrl ||
        apiKey !== baseApiKey ||
        tenantId !== baseTenantId ||
        nodeOptions !== baseNodeOptions
      ) {
        return createGrpcTransport({
          httpVersion: "2",
          baseUrl: `https://${serviceUrl || "directory.prod.aserto.com:8443"}`,
          interceptors: [createHeadersInterceptor(apiKey, tenantId)],
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

    const baseServiceUrl = config.url;
    const baseApiKey = config.apiKey;
    const baseTenantId = config.tenantId;
    const baseCaFile = !!config.caFile
      ? readFileSync(config.caFile)
      : undefined;

    const baseNodeOptions = { rejectUnauthorized, ca: baseCaFile };

    const baseGrpcTransport =
      !!config.url || (!!config.apiKey && !!config.tenantId)
        ? createGrpcTransport({
            httpVersion: "2",
            baseUrl: `https://${baseServiceUrl}`,
            interceptors: [baseServiceHeaders],
            nodeOptions: baseNodeOptions,
          })
        : undefined;

    const readerGrpcTransport = createTransport(config.reader, config);
    const writerGrpcTransport = createTransport(config.writer, config);
    const importerGrpcTransport = createTransport(config.importer, config);
    const exporterGrpcTransport = createTransport(config.exporter, config);

    const modelGrpcTransport = createTransport(config.model, config);

    this.ReaderClient = !!readerGrpcTransport
      ? createPromiseClient(Reader, readerGrpcTransport)
      : (nullReaderProxy as unknown as PromiseClient<typeof Reader>);
    this.WriterClient = !!writerGrpcTransport
      ? createPromiseClient(Writer, writerGrpcTransport)
      : (nullWriterProxy as unknown as PromiseClient<typeof Writer>);
    this.ImporterClient = !!importerGrpcTransport
      ? createPromiseClient(Importer, importerGrpcTransport)
      : (nullImporterProxy as unknown as PromiseClient<typeof Importer>);
    this.ExporterClient = !!exporterGrpcTransport
      ? createPromiseClient(Exporter, exporterGrpcTransport)
      : (nullExporterProxy as unknown as PromiseClient<typeof Exporter>);

    this.ModelClient = !!modelGrpcTransport
      ? createPromiseClient(Model, modelGrpcTransport)
      : (nullModelProxy as unknown as PromiseClient<typeof Model>);
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

  async check(params: CheckRequest) {
    try {
      const response = await this.ReaderClient.check(params);

      return response;
    } catch (error) {
      handleError(error, "check");
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

      return response?.result;
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
          options: Option[params.options],
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
      if (!response) {
        return;
      }

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
      case Code.FailedPrecondition: {
        throw new EtagMismatchError(
          `invalid etag in ${method} request: ${error.message}`
        );
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
