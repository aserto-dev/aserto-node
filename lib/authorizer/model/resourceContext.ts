import { JsonObject } from "@bufbuild/protobuf";

export type CheckResourceContext = {
  relation: string;
  object_type: string;
  object_id: string;
  subject_type: string;
};

export type ResourceContext = JsonObject;
