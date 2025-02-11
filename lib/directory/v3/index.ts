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
  ChecksRequestSchema,
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
import { create, JsonObject, Message } from "@bufbuild/protobuf";
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
import { DsRegistry } from "./serializer";
import {
  CheckRequest,
  CheckResponse,
  ChecksRequest,
  ChecksResponse,
  DeleteManifestResponse,
  DeleteObjectRequest,
  DeleteObjectResponse,
  DeleteRelationRequest,
  DeleteRelationResponse,
  DirectoryV3Config,
  ExportOptions,
  ExportResponse,
  GetGraphRequest,
  GetGraphResponse,
  GetManifestResponse,
  GetObjectManyRequest,
  GetObjectManyResponse,
  GetObjectRequest,
  GetObjectResponse,
  GetObjectsRequest,
  GetObjectsResponse,
  GetRelationRequest,
  GetRelationResponse,
  GetRelationsRequest,
  GetRelationsResponse,
  ImportRequest as ImportRequest$,
  ImportResponse,
  ServiceConfig,
  SetManifestResponse,
  SetObjectRequest,
  SetObjectResponse,
  SetRelationRequest,
  SetRelationResponse,
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

const ADDRESS_REGEX = /https?:\/\//;

export class DirectoryV3 {
  ReaderClient: Client<typeof Reader>;
  WriterClient: Client<typeof Writer>;
  ImporterClient: Client<typeof Importer>;
  ExporterClient: Client<typeof Exporter>;
  ModelClient: Client<typeof Model>;
  registry: DsRegistry;

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

    const getServiceUrl = (baseServiceUrl: string) => {
      const scheme = "https://";

      const serviceUrlMatch = baseServiceUrl?.match(ADDRESS_REGEX);
      return serviceUrlMatch ? baseServiceUrl : `${scheme}${baseServiceUrl}`;
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
          baseUrl: getServiceUrl(
            serviceUrl || "directory.prod.aserto.com:8443",
          ),
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
            baseUrl: getServiceUrl(baseServiceUrl!),
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
    this.registry = new DsRegistry(...(config.additionalDescriptors || []));
  }

  async check(
    params: CheckRequest,
    options?: CallOptions,
  ): Promise<CheckResponse> {
    try {
      const response = await this.ReaderClient.check(
        create(CheckRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "check");
    }
  }

  async checks(
    params: ChecksRequest,
    options?: CallOptions,
  ): Promise<ChecksResponse> {
    try {
      const response = await this.ReaderClient.checks(
        create(ChecksRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "checks");
    }
  }

  async object(
    params: GetObjectRequest,
    options?: CallOptions,
  ): Promise<GetObjectResponse> {
    try {
      if (params.page) {
        params.page.size ||= 100;
      }

      const response = await this.ReaderClient.getObject(
        create(GetObjectRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "object");
    }
  }
  async objects(
    params: GetObjectsRequest,
    options?: CallOptions,
  ): Promise<GetObjectsResponse> {
    try {
      if (params.page) {
        params.page.size ||= 100;
      }
      const response = await this.ReaderClient.getObjects(
        create(GetObjectsRequestSchema, params),
        options,
      );
      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "objects");
    }
  }

  async objectMany(
    params: GetObjectManyRequest,
    options?: CallOptions,
  ): Promise<GetObjectManyResponse> {
    try {
      const response = await this.ReaderClient.getObjectMany(
        create(GetObjectManyRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "objectMany");
    }
  }

  async setObject(
    params: SetObjectRequest,
    options?: CallOptions,
  ): Promise<SetObjectResponse> {
    try {
      delete params.object?.updatedAt;
      delete params.object?.createdAt;

      const response = await this.WriterClient.setObject(
        create(SetObjectRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "setObject");
    }
  }

  async deleteObject(
    params: DeleteObjectRequest,
    options?: CallOptions,
  ): Promise<DeleteObjectResponse> {
    try {
      const response = await this.WriterClient.deleteObject(
        create(DeleteObjectRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "deleteObject");
    }
  }

  async relation(
    params: GetRelationRequest,
    options?: CallOptions,
  ): Promise<GetRelationResponse> {
    try {
      const response = await this.ReaderClient.getRelation(
        create(GetRelationRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "relation");
    }
  }

  async setRelation(
    params: SetRelationRequest,
    options?: CallOptions,
  ): Promise<SetRelationResponse> {
    try {
      delete params.relation?.updatedAt;
      delete params.relation?.createdAt;

      const response = await this.WriterClient.setRelation(
        create(SetRelationRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "setRelation");
    }
  }

  async deleteRelation(
    params: DeleteRelationRequest,
    options?: CallOptions,
  ): Promise<DeleteRelationResponse> {
    try {
      const response = await this.WriterClient.deleteRelation(
        create(DeleteRelationRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "deleteRelation");
    }
  }

  async relations(
    params: GetRelationsRequest,
    options?: CallOptions,
  ): Promise<GetRelationsResponse> {
    try {
      if (params.page) {
        params.page.size ||= 100;
      }

      const response = await this.ReaderClient.getRelations(params, options);
      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "relations");
    }
  }

  async graph(
    params: GetGraphRequest,
    options?: CallOptions,
  ): Promise<GetGraphResponse> {
    try {
      const response = await this.ReaderClient.getGraph(
        create(GetGraphRequestSchema, params),
        options,
      );

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "graph");
    }
  }

  async import(
    params: AsyncIterable<ImportRequest>,
    options?: CallOptions,
  ): Promise<ImportResponse> {
    try {
      return this.ImporterClient.import(params, options);
    } catch (error) {
      throw handleError(error, "import");
    }
  }

  async export(
    params: { options: DATA_TYPE_OPTIONS },
    options?: CallOptions,
  ): Promise<ExportResponse> {
    try {
      return this.ExporterClient.export(
        create(ExportRequestSchema, {
          options: ExportOptions[params.options],
        }),
        options,
      );
    } catch (error) {
      throw handleError(error, "export");
    }
  }

  async getManifest(
    params?: GetManifestRequest,
    options?: CallOptions,
  ): Promise<GetManifestResponse> {
    try {
      const response = this.ModelClient.getManifest(params!, options);

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
        updatedAt: metadata?.updatedAt
          ? this.registry.serializeResponse(metadata?.updatedAt)
          : undefined,
        etag: metadata?.etag,
      };
    } catch (error) {
      throw handleError(error, "getManifest");
    }
  }

  async setManifest(
    params: { body: string },
    options?: CallOptions,
  ): Promise<SetManifestResponse> {
    try {
      const response = await this.ModelClient.setManifest(
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

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "setManifest");
    }
  }

  async deleteManifest(
    params?: DeleteManifestRequest,
    options?: CallOptions,
  ): Promise<DeleteManifestResponse> {
    try {
      const response = await this.ModelClient.deleteManifest(params!, options);

      return this.registry.serializeResponse(response);
    } catch (error) {
      throw handleError(error, "deleteManifest");
    }
  }
}

/**
 * Reads all elements from an AsyncIterable and returns them as an array.
 *
 * @template T - The type of elements in the AsyncIterable.
 * @param {AsyncIterable<T>} gen - The AsyncIterable to read from.
 * @returns {Promise<T[]>} A promise that resolves to an array containing all elements from the AsyncIterable.
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

/**
 * Reads all elements from an AsyncIterable and serialize them as an JSON array.
 *
 * @template T - The type of elements in the AsyncIterable.
 * @param {AsyncIterable<T>} gen - The AsyncIterable to read from.
 * @returns {Promise<T[]>} A promise that resolves to an array containing all elements from the AsyncIterable.
 */
export async function serializeAsyncIterable<T extends Message>(
  gen: AsyncIterable<T>,
): Promise<T[]> {
  const registry = new DsRegistry();
  const out: T[] = [];
  for await (const x of gen) {
    out.push(registry.serializeResponse<T>(x));
  }
  return out;
}
/**
 * Creates an asynchronous iterable of import requests.
 *
 * @param { ImportRequest$[]} params - An array of ImportRequest to be converted into ImportRequest objects.
 * @yields ImportRequest objects created from the provided parameters.
 */
export async function* createImportRequest(params: ImportRequest$[]) {
  yield* createAsyncIterable$(
    params.map((param) => create(ImportRequestSchema, param as ImportRequest)),
  );
}

/**
 * Asynchronously iterates over an array of items, yielding each item.
 *
 * @deprecated Use `createImportRequest` instead.
 *
 * @template T
 * @param {T[]} items - The array of items to iterate over.
 */
export async function* createAsyncIterable<T>(items: T[]) {
  log("[Deprecated]: please use `createImportRequest`");
  yield* createImportRequest(items as ImportRequest$[]);
}

/**
 * Old Implementation: Converts a JSON object to a Protobuf Struct.
 *
 * Current Implementation: noop. Returns the input object
 *
 * * @deprecated This function is deprecated as the SDK no longer requires
 * conversion from JSON to Struct. Use the value directly.
 *
 * @param value - The JSON object to convert.
 * @returns The converted Protobuf Struct.
 */
export function objectPropertiesAsStruct(value: JsonObject): JsonObject {
  log(
    "[Deprecated]: This version of SDK does not require conversion from JSON to Struct. Use the value directly",
  );
  return value;
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

/**
 * Creates a new instance of the DirectoryV3 class.
 *
 * @param {DirectoryV3Config} config - The configuration object for initializing the DirectoryV3 instance.
 * @returns {DirectoryV3} A new instance of the DirectoryV3 class.
 */
export const DirectoryServiceV3 = (config: DirectoryV3Config): DirectoryV3 => {
  return new DirectoryV3(config);
};
