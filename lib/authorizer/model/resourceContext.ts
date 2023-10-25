import { JavaScriptValue } from "google-protobuf/google/protobuf/struct_pb";

export type ResourceContext = {
  [key: string]: JavaScriptValue;
};

export type CheckResourceContext = {
  relation: string;
  object_type: string;
  object_key: string;
};
