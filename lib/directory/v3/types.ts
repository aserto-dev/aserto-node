import {
  Object$ as Object$$,
  ObjectIdentifier as ObjectIdentifier$,
  PaginationRequest as PaginationRequest$,
  PaginationResponse as PaginationResponse$,
  Relation as Relation$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
import {
  ExportResponse as ExportResponse$,
  Option,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import {
  ImportRequest as ImportRequest$,
  ImportResponse as ImportResponse$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import {
  DeleteManifestResponse as DeleteManifestResponse$,
  SetManifestResponse as SetManifestResponse$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import { GetManifestRequest as GetManifestRequest$ } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import {
  CheckRequest as CheckRequest$,
  CheckResponse as CheckResponse$,
  ChecksRequest as ChecksRequest$,
  ChecksResponse as ChecksResponse$,
  GetGraphRequest as GetGraphRequest$,
  GetGraphResponse as GetGraphResponse$,
  GetObjectManyRequest as GetObjectManyRequest$,
  GetObjectManyResponse as GetObjectManyResponse$,
  GetObjectRequest as GetObjectRequest$,
  GetObjectResponse as GetObjectResponse$,
  GetObjectsRequest as GetObjectsRequest$,
  GetObjectsResponse as GetObjectsResponse$,
  GetRelationRequest as GetRelationRequest$,
  GetRelationResponse as GetRelationResponse$,
  GetRelationsRequest as GetRelationsRequest$,
  GetRelationsResponse as GetRelationsResponse$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import {
  DeleteObjectRequest as DeleteObjectRequest$,
  DeleteObjectResponse as DeleteObjectResponse$,
  DeleteRelationRequest as DeleteRelationRequest$,
  DeleteRelationResponse as DeleteRelationResponse$,
  SetObjectRequest as SetObjectRequest$,
  SetObjectResponse as SetObjectResponse$,
  SetRelationRequest as SetRelationRequest$,
  SetRelationResponse as SetRelationResponse$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import {
  DescEnum,
  DescExtension,
  DescFile,
  DescMessage,
  DescService,
  JsonObject,
  Registry,
} from "@bufbuild/protobuf";
import { Timestamp } from "@bufbuild/protobuf/wkt";

import { NestedOmit, NestedOptional, Optional } from "../../util/types";

// export service types
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/schema/v3/group_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/schema/v3/identity_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/schema/v3/tenant_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/schema/v3/user_pb";
export * from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";

export enum StatsExportOptions {
  STATS_OBJECTS = Option.STATS | Option.DATA_OBJECTS,
  STATS_RELATIONS = Option.STATS | Option.DATA_RELATIONS,
  STATS_DATA = Option.STATS | Option.DATA,
}

export const ExportOptions = { ...Option, ...StatsExportOptions };
export type CheckRequest = Optional<Omit<CheckRequest$, "$typeName">, "trace">;

export type CheckResponse = Omit<CheckResponse$, "$typeName" | "$unknown">;
export type ChecksRequest = Omit<
  ChecksRequest$,
  "$typeName" | "checks" | "default"
> & {
  default?: CheckRequest;
  checks: CheckRequest[];
};

export type ChecksResponse = Omit<
  ChecksResponse$,
  "$typeName" | "$unknown" | "checks"
> & {
  checks: CheckResponse[];
};

export type CustomHeaders = {
  [key: string]: string;
};
export type DeleteManifestResponse = Omit<
  DeleteManifestResponse$,
  "$typeName" | "$unknown"
>;
export type DeleteObjectRequest = Optional<
  Omit<DeleteObjectRequest$, "$typeName">,
  "withRelations"
>;

export type DeleteObjectResponse = Omit<
  DeleteObjectResponse$,
  "$typeName" | "$unknown"
>;

export type DeleteRelationRequest = Optional<
  Omit<DeleteRelationRequest$, "$typeName">,
  "subjectRelation"
>;

export type DeleteRelationResponse = Omit<
  DeleteRelationResponse$,
  "$typeName" | "$unknown"
>;

export type DirectoryV3Config = ServiceConfig & {
  additionalDescriptors?: (
    | DescEnum
    | DescExtension
    | DescFile
    | DescMessage
    | DescService
    | Registry
  )[];
} & {
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  model?: ServiceConfig;
};

export type ExportOptions = typeof Option & typeof StatsExportOptions;

export type ExportResponse = AsyncIterable<ExportResponse$>;

export type GetGraphRequest = Optional<
  Omit<GetGraphRequest$, "$typeName">,
  | "explain"
  | "objectId"
  | "objectType"
  | "subjectId"
  | "subjectRelation"
  | "subjectType"
  | "trace"
>;

export type GetGraphResponse = Omit<
  GetGraphResponse$,
  "$typeName" | "$unknown"
>;

export type GetManifestRequest = Omit<
  GetManifestRequest$,
  "$typeName" | "$unknown"
>;

export type GetManifestResponse = {
  body: string;
  model: JsonObject;
  updatedAt: Timestamp | undefined;
  etag: string;
};
export type GetObjectManyRequest = Omit<
  GetObjectManyRequest$,
  "$typeName" | "param"
> & {
  param: ObjectIdentifier[];
};

export type GetObjectManyResponse = Omit<
  GetObjectManyResponse$,
  "$typeName" | "$unknown"
>;

export type GetObjectRequest = Optional<
  Omit<GetObjectRequest$, "$typeName" | "page">,
  "withRelations"
> & { page?: PaginationRequest };

export type GetObjectResponse = Omit<
  GetObjectResponse$,
  "$typeName" | "$unknown" | "page"
> & { page?: PaginationResponse };

export type GetObjectsRequest = Omit<
  GetObjectsRequest$,
  "$typeName" | "page"
> & { page?: PaginationRequest };

export type GetObjectsResponse = Omit<
  GetObjectsResponse$,
  "$typeName" | "$unknown" | "page"
> & { page?: PaginationResponse };

export type GetRelationRequest = Optional<
  Omit<GetRelationRequest$, "$typeName">,
  | "objectId"
  | "objectType"
  | "relation"
  | "subjectId"
  | "subjectRelation"
  | "subjectType"
  | "withObjects"
>;

export type GetRelationResponse = Omit<
  GetRelationResponse$,
  "$typeName" | "$unknown"
>;
export type GetRelationsRequest = Optional<
  Omit<GetRelationsRequest$, "$typeName" | "page">,
  | "objectId"
  | "objectType"
  | "relation"
  | "subjectId"
  | "subjectRelation"
  | "subjectType"
  | "withEmptySubjectRelation"
  | "withObjects"
> & { page?: PaginationRequest };

export type GetRelationsResponse = Omit<
  GetRelationsResponse$,
  "$typeName" | "$unknown" | "page"
> & { page?: PaginationResponse };
export type ImportRequest = Omit<
  NestedOmit<
    NestedOptional<
      ImportRequest$,
      [
        "msg.value.properties",
        "msg.value.etag",
        "msg.value.displayName",
        "msg.value.subjectRelation",
      ]
    >,
    "msg.value.$typeName"
  >,
  "$typeName"
>;
export type ImportResponse = AsyncIterable<ImportResponse$>;
export type Object$ = Optional<
  Omit<Object$$, "$typeName">,
  "displayName" | "etag"
>;
export type ObjectIdentifier = Omit<ObjectIdentifier$, "$typeName">;
export type PaginationRequest = Optional<
  Omit<PaginationRequest$, "$typeName">,
  "size" | "token"
>;

export type PaginationResponse = Omit<
  PaginationResponse$,
  "$typeName" | "$unknown"
>;
export type Relation = Optional<
  Omit<Relation$, "$typeName">,
  "etag" | "subjectRelation"
>;
export type ServiceConfig = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  token?: string;
  caFile?: string;
  rejectUnauthorized?: boolean;
  insecure?: boolean;
  customHeaders?: CustomHeaders;
};
export type SetManifestResponse = Omit<
  SetManifestResponse$,
  "$typeName" | "$unknown"
>;

export type SetObjectRequest = Omit<
  SetObjectRequest$,
  "$typeName" | "object"
> & { object?: Object$ };

export type SetObjectResponse = Omit<
  SetObjectResponse$,
  "$typeName" | "$unknown"
>;

export type SetRelationRequest = Omit<
  SetRelationRequest$,
  "$typeName" | "relation"
> & { relation: Optional<Relation, "etag" | "subjectRelation"> };

export type SetRelationResponse = Omit<
  SetRelationResponse$,
  "$typeName" | "$unknown"
>;
