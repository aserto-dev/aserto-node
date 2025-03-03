import { IdentityContext as IdentityContext$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext as PolicyContext$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance as PolicyInstance$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";
import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  ListPoliciesRequest as ListPoliciesRequest$,
  QueryOptions as QueryOptions$,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { FieldMask as FieldMask$ } from "@bufbuild/protobuf/wkt";

import { Optional } from "../util/types";

export {
  Decision as DecisionLog,
  DecisionSchema as DecisionLogSchema,
  DecisionPolicy,
  DecisionPolicySchema,
  DecisionUser,
  DecisionUserSchema,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/decision_logs_pb";
export * from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
export * from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/module_pb";
export * from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";
export * from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";
import { Module as Module$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/module_pb";
export * from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";

export type DecisionTreeRequest = Omit<
  DecisionTreeRequest$,
  "$typeName" | "identityContext" | "policyContext" | "policyInstance"
> & {
  policyInstance?: PolicyInstance;
  policyContext?: PolicyContext;
  identityContext?: IdentityContext;
};
export type FieldMask = Omit<FieldMask$, "$typeName">;
export type IdentityContext = Omit<IdentityContext$, "$typeName">;
export type IsRequest = Omit<
  IsRequest$,
  "$typeName" | "identityContext" | "policyContext" | "policyInstance"
> & {
  policyInstance?: PolicyInstance;
  policyContext?: PolicyContext;
  identityContext?: IdentityContext;
};

export type ListPoliciesRequest = Omit<
  ListPoliciesRequest$,
  "$typeName" | "fieldMask" | "policyInstance"
> & {
  fieldMask?: FieldMask;
  policyInstance?: PolicyInstance;
};

export type Module = Omit<Module$, "$typeName">;

export type PolicyContext = Omit<PolicyContext$, "$typeName">;

export type PolicyInstance = Omit<
  PolicyInstance$,
  "$typeName" | "instanceLabel"
>;
export type QueryOptions = Optional<
  Omit<QueryOptions$, "$typeName">,
  "instrument" | "metrics" | "trace" | "traceSummary"
>;

export type QueryRequest = Omit<
  QueryRequest$,
  | "$typeName"
  | "identityContext"
  | "options"
  | "policyContext"
  | "policyInstance"
> & {
  policyInstance?: PolicyInstance;
  policyContext?: PolicyContext;
  identityContext?: IdentityContext;
  options?: QueryOptions;
};
