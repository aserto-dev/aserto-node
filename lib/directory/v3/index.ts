import { readFileSync } from "fs";
import {
  Exporter,
  ExportRequestSchema,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import {
  Importer,
  ImportRequest,
  ImportRequestSchema,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import {
  Model,
  SetManifestRequestSchema,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import {
  Body,
  DeleteManifestRequest,
  GetManifestRequest,
  Metadata,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import {
  CheckRequestSchema,
  GetGraphRequestSchema,
  GetObjectManyRequestSchema,
  GetObjectRequestSchema,
  GetObjectsRequestSchema,
  GetRelationRequestSchema,
  Reader,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import {
  DeleteObjectRequestSchema,
  DeleteRelationRequestSchema,
  SetObjectRequestSchema,
  SetRelationRequestSchema,
  Writer,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import { create } from "@bufbuild/protobuf";
import {
  CallOptions,
  Client,
  createClient,
  Interceptor,
  Transport,
} from "@connectrpc/connect";
import { createAsyncIterable as createAsyncIterable$ } from "@connectrpc/connect/protocol";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { log } from "../../log";
import {
  handleError,
  setCustomHeaders,
  setHeader,
  traceMessage,
} from "../../util/connect";
import {
  nullExporterProxy,
  nullImporterProxy,
  nullModelProxy,
  nullReaderProxy,
  nullWriterProxy,
} from "./null";
import {
  CheckRequest,
  DeleteObjectRequest,
  DeleteRelationRequest,
  DirectoryV3Config,
  ExportOptions,
  GetGraphRequest,
  GetObjectManyRequest,
  GetObjectRequest,
  GetObjectsRequest,
  GetRelationRequest,
  GetRelationsRequest,
  ImportRequest as ImportRequest$,
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
 * "STATS" - stats
 *
 * "STATS_OBJECTS" - objects stats = STATS | DATA_OBJECTS
 *
 * "STATS_RELATIONS" - relations stats = STATS | DATA_RELATIONS
 *
 * "STATS_DATA" - all data stats = STATS | DATA
 */
type DATA_TYPE_OPTIONS = keyof ExportOptions;

/**
 * Enum representing the different cases for importing data.
 * The cases are "object" and "relation".
 *
 *  OBJECT = "object"
 *
 *  RELATION = "relation"
 *
 */
export enum ImportMsgCase {
  OBJECT = "object",
  RELATION = "relation",
}

export class DirectoryV3 {
  ReaderClient: Client<typeof Reader>;
  WriterClient: Client<typeof Writer>;
  ImporterClient: Client<typeof Importer>;
  ExporterClient: Client<typeof Exporter>;
  ModelClient: Client<typeof Model>;
  CreateTransport: (
    config: ServiceConfig | undefined,
    fallback: ServiceConfig | undefined,
  ) => Transport | undefined;

  constructor(config: DirectoryV3Config) {
    const baseServiceHeaders: Interceptor = (next) => async (req) => {
      config.token && setHeader(req, "authorization", `${config.token}`);
      config.apiKey &&
        setHeader(req, "authorization", `basic ${config.apiKey}`);
      config.tenantId && setHeader(req, "aserto-tenant-id", config.tenantId);
      return await next(req);
    };

    const createHeadersInterceptor = (
      serviceApiKey?: string,
      serviceTenantId?: string,
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
      fallback: ServiceConfig | undefined,
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
      fallback: ServiceConfig | undefined,
    ) => {
      if (!validConfig(config, fallback)) {
        return;
      }

      const serviceUrl = config?.url || fallback?.url;
      const apiKey = config?.apiKey || fallback?.apiKey;
      const tenantId = config?.tenantId || fallback?.tenantId;
      const nodeOptions = createNodeOptions(config);
      let customHeaders = Object.assign({}, fallback?.customHeaders || {});
      customHeaders = Object.assign(customHeaders, config?.customHeaders || {});

      if (
        serviceUrl !== baseServiceUrl ||
        apiKey !== baseApiKey ||
        tenantId !== baseTenantId ||
        nodeOptions !== baseNodeOptions
      ) {
        const interceptors = [createHeadersInterceptor(apiKey, tenantId)];
        if (process.env.NODE_TRACE_MESSAGE) {
          interceptors.push(traceMessage);
        }
        interceptors.push(setCustomHeaders(customHeaders));
        return createGrpcTransport({
          baseUrl: `https://${serviceUrl || "directory.prod.aserto.com:8443"}`,
          interceptors: interceptors,
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

    if (config.insecure !== undefined) {
      rejectUnauthorized = !config.insecure;
    }

    const baseServiceUrl = config.url;
    const baseApiKey = config.apiKey;
    const baseTenantId = config.tenantId;
    const baseCaFile = !!config.caFile
      ? readFileSync(config.caFile)
      : undefined;

    const baseNodeOptions = {
      rejectUnauthorized,
      ca: baseCaFile,
    };
    const interceptors = [baseServiceHeaders];
    if (process.env.NODE_TRACE_MESSAGE) {
      interceptors.push(traceMessage);
    }

    const baseGrpcTransport =
      !!config.url || (!!config.apiKey && !!config.tenantId)
        ? createGrpcTransport({
            baseUrl: `https://${baseServiceUrl}`,
            interceptors: interceptors,
            nodeOptions: baseNodeOptions,
          })
        : undefined;

    const readerGrpcTransport = createTransport(config.reader, config);
    const writerGrpcTransport = createTransport(config.writer, config);
    const importerGrpcTransport = createTransport(config.importer, config);
    const exporterGrpcTransport = createTransport(config.exporter, config);

    const modelGrpcTransport = createTransport(config.model, config);

    this.ReaderClient = !!readerGrpcTransport
      ? createClient(Reader, readerGrpcTransport)
      : nullReaderProxy();
    this.WriterClient = !!writerGrpcTransport
      ? createClient(Writer, writerGrpcTransport)
      : nullWriterProxy();
    this.ImporterClient = !!importerGrpcTransport
      ? createClient(Importer, importerGrpcTransport)
      : nullImporterProxy();
    this.ExporterClient = !!exporterGrpcTransport
      ? createClient(Exporter, exporterGrpcTransport)
      : nullExporterProxy();

    this.ModelClient = !!modelGrpcTransport
      ? createClient(Model, modelGrpcTransport)
      : nullModelProxy();

    this.CreateTransport = createTransport;
  }

  async check(params: CheckRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.check(
        create(CheckRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "check");
    }
  }

  async object(params: GetObjectRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.getObject(
        create(GetObjectRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "object");
    }
  }
  async objects(params: GetObjectsRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.getObjects(
        create(GetObjectsRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "objects");
    }
  }

  async objectMany(params: GetObjectManyRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.getObjectMany(
        create(GetObjectManyRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "objectMany");
    }
  }

  async setObject(params: SetObjectRequest, options?: CallOptions) {
    try {
      return await this.WriterClient.setObject(
        create(SetObjectRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "setObject");
    }
  }

  async deleteObject(params: DeleteObjectRequest, options?: CallOptions) {
    try {
      return await this.WriterClient.deleteObject(
        create(DeleteObjectRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "deleteObject");
    }
  }

  async relation(params: GetRelationRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.getRelation(
        create(GetRelationRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "relation");
    }
  }

  async setRelation(params: SetRelationRequest, options?: CallOptions) {
    try {
      return this.WriterClient.setRelation(
        create(SetRelationRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "setRelation");
    }
  }

  async deleteRelation(params: DeleteRelationRequest, options?: CallOptions) {
    try {
      return await this.WriterClient.deleteRelation(
        create(DeleteRelationRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "deleteRelation");
    }
  }

  async relations(params: GetRelationsRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.getRelations(params, options);
    } catch (error) {
      handleError(error, "relations");
    }
  }

  async graph(params: GetGraphRequest, options?: CallOptions) {
    try {
      return await this.ReaderClient.getGraph(
        create(GetGraphRequestSchema, params),
        options,
      );
    } catch (error) {
      handleError(error, "graph");
    }
  }

  async import(params: AsyncIterable<ImportRequest>, options?: CallOptions) {
    try {
      return this.ImporterClient.import(params, options);
    } catch (error) {
      handleError(error, "import");
      return createAsyncIterable$([]);
    }
  }

  async export(params: { options: DATA_TYPE_OPTIONS }, options?: CallOptions) {
    try {
      return this.ExporterClient.export(
        create(ExportRequestSchema, {
          options: ExportOptions[params.options],
        }),
        options,
      );
    } catch (error) {
      handleError(error, "export");
      return createAsyncIterable$([]);
    }
  }

  async getManifest(params?: GetManifestRequest, options?: CallOptions) {
    try {
      const response = this.ModelClient.getManifest(params!, options);
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

  async setManifest(params: { body: string }, options?: CallOptions) {
    try {
      return await this.ModelClient.setManifest(
        createAsyncIterable$([
          create(SetManifestRequestSchema, {
            msg: {
              case: "body",
              value: { data: new TextEncoder().encode(params.body) },
            },
          }),
        ]),
        options,
      );
    } catch (error) {
      handleError(error, "setManifest");
    }
  }

  async deleteManifest(params?: DeleteManifestRequest, options?: CallOptions) {
    try {
      return await this.ModelClient.deleteManifest(params!, options);
    } catch (error) {
      handleError(error, "deleteManifest");
    }
  }
}

/**
 * Read an asynchronous iterable into an array.
 */
export async function readAsyncIterable<T>(
  gen: AsyncIterable<T>,
): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
  }
  return out;
}

export async function* createImportRequest(params: ImportRequest$[]) {
  yield* createAsyncIterable$(
    params.map((param) => create(ImportRequestSchema, param as ImportRequest)),
  );
}

export async function* createAsyncIterable<T>(items: T[]) {
  log("[Deprecated]: please use `createImportRequest`");
  yield* createImportRequest(items as ImportRequest$[]);
}

/**
 * Converts a JSON object to a Protobuf Struct.
 *
 * @param value - The JSON object to convert.
 * @returns The converted Protobuf Struct.
 */

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
