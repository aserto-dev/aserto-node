import { JsonObject } from "@bufbuild/protobuf";

export type ResourceContext = JsonObject;

export type CheckResourceContext = {
  relation: string;
  object_type: string;
  object_id: string;
  subject_type: string;
};
