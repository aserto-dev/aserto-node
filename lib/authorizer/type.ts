import { PolicyInstance } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";
import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { JsonObject, PartialMessage, PlainMessage } from "@bufbuild/protobuf";

export type IsRequest = Omit<
  PlainMessage<IsRequest$>,
  "resourceContext" | "policyInstance"
> & {
  resourceContext?: JsonObject;
  policyInstance?: Omit<PartialMessage<PolicyInstance>, "instanceLabel">;
};

export type QueryRequest = Omit<
  PlainMessage<QueryRequest$>,
  "resourceContext" | "policyInstance"
> & {
  resourceContext?: JsonObject;
  policyInstance?: Omit<PartialMessage<PolicyInstance>, "instanceLabel">;
};

export type DecisionTreeRequest = Omit<
  PlainMessage<DecisionTreeRequest$>,
  "resourceContext" | "policyInstance"
> & {
  resourceContext?: JsonObject;
  policyInstance?: Omit<PartialMessage<PolicyInstance>, "instanceLabel">;
};
