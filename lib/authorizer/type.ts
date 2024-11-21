import { IdentityContext as IdentityContext$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext as PolicyContext$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance as PolicyInstance$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";
import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  QueryOptions as QueryOptions$,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { ListPoliciesRequest as ListPoliciesRequest$ } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";

import { Optional } from "../util/types";

type PolicyInstance = Omit<PolicyInstance$, "$typeName" | "instanceLabel">;
type PolicyContext = Omit<PolicyContext$, "$typeName">;
type IdentityContext = Omit<IdentityContext$, "$typeName">;
export type QueryOptions = Optional<
  Omit<QueryOptions$, "$typeName">,
  "instrument" | "metrics" | "trace" | "traceSummary"
>;

export type IsRequest = Omit<
  IsRequest$,
  "policyContext" | "policyInstance" | "identityContext" | "$typeName"
> & {
  policyInstance?: PolicyInstance;
  policyContext?: PolicyContext;
  identityContext?: IdentityContext;
};

export type QueryRequest = Omit<
  QueryRequest$,
  | "policyContext"
  | "policyInstance"
  | "identityContext"
  | "options"
  | "$typeName"
> & {
  policyInstance?: PolicyInstance;
  policyContext?: PolicyContext;
  identityContext?: IdentityContext;
  options?: QueryOptions;
};

export type DecisionTreeRequest = Omit<
  DecisionTreeRequest$,
  "policyContext" | "policyInstance" | "identityContext" | "$typeName"
> & {
  policyInstance?: PolicyInstance;
  policyContext?: PolicyContext;
  identityContext?: IdentityContext;
};

export type ListPoliciesRequest = Omit<ListPoliciesRequest$, "$typeName">;
