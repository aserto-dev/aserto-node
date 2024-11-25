import {
  Object$,
  ObjectIdentifier as ObjectIdentifier$,
  PaginationRequest as PaginationRequest$,
  Relation as Relation$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
import { Option } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import { ImportRequest as ImportRequest$ } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import {
  CheckRequest as CheckRequest$,
  GetGraphRequest as GetGraphRequest$,
  GetObjectManyRequest as GetObjectManyRequest$,
  GetObjectRequest as GetObjectRequest$,
  GetObjectsRequest as GetObjectsRequest$,
  GetRelationRequest as GetRelationRequest$,
  GetRelationsRequest as GetRelationsRequest$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import {
  DeleteObjectRequest as DeleteObjectRequest$,
  DeleteRelationRequest as DeleteRelationRequest$,
  SetObjectRequest as SetObjectRequest$,
  SetRelationRequest as SetRelationRequest$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";

import { NestedOmit, NestedOptional, Optional } from "../../util/types";

enum StatsExportOptions {
  STATS_OBJECTS = Option.STATS | Option.DATA_OBJECTS,
  STATS_RELATIONS = Option.STATS | Option.DATA_RELATIONS,
  STATS_DATA = Option.STATS | Option.DATA,
}

export const ExportOptions = { ...Option, ...StatsExportOptions };
export type ExportOptions = typeof Option & typeof StatsExportOptions;

export type CustomHeaders = {
  [key: string]: string;
};
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

export type DirectoryV3Config = ServiceConfig & {
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  model?: ServiceConfig;
};
type Object = Optional<Omit<Object$, "$typeName">, "etag" | "displayName">;
type Relation = Optional<
  Omit<Relation$, "$typeName">,
  "etag" | "subjectRelation"
>;
type ObjectIdentifier = Omit<ObjectIdentifier$, "$typeName">;

type PaginationRequest = Optional<
  Omit<PaginationRequest$, "$typeName">,
  "token"
>;

export type GetObjectRequest = Optional<
  Omit<GetObjectRequest$, "$typeName" | "page">,
  "withRelations"
> & { page?: PaginationRequest };

export type GetObjectsRequest = Omit<
  GetObjectsRequest$,
  "$typeName" | "page"
> & { page?: PaginationRequest };

export type GetRelationRequest = Optional<
  Omit<GetRelationRequest$, "$typeName">,
  "subjectRelation" | "withObjects" | "subjectId"
>;

export type GetRelationsRequest = Optional<
  Omit<GetRelationsRequest$, "$typeName" | "page">,
  | "objectId"
  | "objectType"
  | "relation"
  | "subjectId"
  | "subjectRelation"
  | "subjectType"
  | "withObjects"
  | "withEmptySubjectRelation"
> & { page?: PaginationRequest };

export type SetObjectRequest = Omit<
  SetObjectRequest$,
  "$typeName" | "object"
> & { object?: Object };

export type DeleteObjectRequest = Optional<
  Omit<DeleteObjectRequest$, "$typeName">,
  "withRelations"
>;

export type SetRelationRequest = Omit<
  SetRelationRequest$,
  "$typeName" | "relation"
> & { relation: Optional<Relation, "etag" | "subjectRelation"> };

export type DeleteRelationRequest = Optional<
  Omit<DeleteRelationRequest$, "$typeName">,
  "subjectRelation"
>;

export type CheckRequest = Optional<Omit<CheckRequest$, "$typeName">, "trace">;

export type GetGraphRequest = Optional<
  Omit<GetGraphRequest$, "$typeName">,
  | "objectType"
  | "objectId"
  | "subjectType"
  | "subjectId"
  | "subjectRelation"
  | "explain"
  | "trace"
>;

export type GetObjectManyRequest = Omit<
  GetObjectManyRequest$,
  "$typeName" | "param"
> & {
  param: ObjectIdentifier[];
};

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
