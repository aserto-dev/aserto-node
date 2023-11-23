import {
  CheckPermissionRequest as CheckPermissionRequest$,
  CheckRelationRequest as CheckRelationRequest$,
  GetGraphRequest as GetGraphRequest$,
  GetObjectRequest as GetObjectRequest$,
  GetRelationRequest as GetRelationRequest$,
  GetRelationsRequest as GetRelationsRequest$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import {
  DeleteObjectRequest as DeleteObjectRequest$,
  DeleteRelationRequest as DeleteRelationRequest$,
  SetObjectRequest as SetObjectRequest$,
  SetRelationRequest as SetRelationRequest$,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import {
  JsonValue,
  PartialMessage,
  PlainMessage,
  Struct,
} from "@bufbuild/protobuf";

import { NestedOmit, PartialExcept } from "../../util/types";

type ServiceConfig = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
};

export type DirectoryV3Config = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  model?: ServiceConfig;
  rejectUnauthorized?: boolean;
};

export type GetObjectRequest = PartialExcept<
  PlainMessage<GetObjectRequest$>,
  ["withRelations"]
>;

export type GetRelationRequest = PartialExcept<
  PlainMessage<GetRelationRequest$>,
  ["subjectRelation", "withObjects", "subjectId"]
>;

export type GetRelationsRequest = PartialMessage<GetRelationsRequest$>;

export type SetObjectRequest = PartialExcept<
  NestedOmit<PlainMessage<SetObjectRequest$>, "object.properties"> & {
    object?: { properties?: { [key: string]: JsonValue } | Struct };
  },
  ["object.etag", "object.displayName"]
>;

export type DeleteObjectRequest = PartialExcept<
  PlainMessage<DeleteObjectRequest$>,
  ["withRelations"]
>;

export type SetRelationRequest = PartialExcept<
  PlainMessage<SetRelationRequest$>,
  ["relation.etag", "relation.subjectRelation"]
>;

export type DeleteRelationRequest = PartialExcept<
  PlainMessage<DeleteRelationRequest$>,
  ["subjectRelation"]
>;

export type CheckPermissionRequest = PartialExcept<
  PlainMessage<CheckPermissionRequest$>,
  ["trace"]
>;

export type CheckRelationRequest = PartialExcept<
  PlainMessage<CheckRelationRequest$>,
  ["trace"]
>;

export type GetGraphRequest = PartialExcept<
  PlainMessage<GetGraphRequest$>,
  [
    "objectType",
    "objectId",
    "relation",
    "subjectType",
    "subjectId",
    "subjectRelation"
  ]
>;
