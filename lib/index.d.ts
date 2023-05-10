import * as express from "express";
import {
  GetGraphRequest,
  Object$,
  ObjectDependency,
  ObjectIdentifier,
  ObjectTypeIdentifier,
  PaginationRequest,
  Relation,
  RelationIdentifier,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import {
  CheckPermissionRequest,
  GetGraphResponse,
  GetObjectManyRequest,
  GetObjectResponse,
  GetRelationsResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_pb";
import { Empty, JsonValue } from "@bufbuild/protobuf";
export = {
  jwtAuthz,
  displayStateMap,
  is,
  ds,
  Directory,
  ServiceConfig,
  IdentityContextOptions,
  DisplayStateMapOptions,
};

declare function jwtAuthz(
  options: jwtAuthz.AuthzOptions,
  packageName?: string,
  resourceMap?: ResourceMapper
): express.Handler;

declare function displayStateMap(
  options: displayStateMap.DisplayStateMapOptions
): express.Handler;

declare function is(
  decision: string,
  req: express.Request,
  options: is.AuthzOptions,
  policy?: is.Policy,
  resourceMap?: ResourceMapper
): boolean;

declare function ds(config: ServiceConfig): Directory;

export type ResourceMapper =
  | object
  | ((req: express.Request) => Promise<object>);

export interface DisplayStateMapOptions {
  policyRoot: string;
  instanceName: string;
  instanceLabel?: string;
  authorizerServiceUrl: string;
  authorizerApiKey?: string;
  tenantId?: string;
  authorizerCertCAFile?: string;
  disableTlsValidation?: boolean;
  useAuthorizationHeader?: boolean;
  identityHeader?: string;
  failWithError?: boolean;
  customUserKey?: string;
  customSubjectKey?: string;
  endpointPath?: string;
}

export interface AuthzOptions {
  policyRoot: string;
  instanceName?: string;
  instanceLabel?: string;
  authorizerServiceUrl: string;
  authorizerApiKey?: string;
  tenantId?: string;
  authorizerCertCAFile?: string;
  disableTlsValidation?: boolean;
  useAuthorizationHeader?: boolean;
  identityHeader?: string;
  failWithError?: boolean;
  customUserKey?: string;
  customSubjectKey?: string;
}

export interface IdentityContextOptions {
  useAuthorizationHeader: boolean;
  identity: string;
  subject: string;
}

export interface Directory {
  checkPermission: (
    params: PartialMessage<CheckPermissionRequest>
  ) => Promise<boolean>;
  object: (params: PartialMessage<ObjectIdentifier>) => Promise<Object$>;
  objects: (params: {
    objectType: PartialMessage<ObjectTypeIdentifier>;
    page?: PaginationRequest;
  }) => Promise<GetObjectResponse>;
  objectMany: (
    params: PartialMessage<GetObjectManyRequest>
  ) => Promise<Object$[]>;
  setObject: (params: JsonValue) => Promise<Object$>;
  relation: (params: PartialMessage<RelationIdentifier>) => Promise<Relation[]>;
  setRelation: (
    params: PartialMessage<SetRelationRequest>
  ) => Promise<Relation | undefined>;
  deleteRelation: (
    params: PartialMessage<DeleteRelationRequest>
  ) => Promise<Empty | undefined>;
  relations: (
    params: PartialMessage<RelationIdentifier>
  ) => Promise<GetRelationsResponse>;
  graph: (
    params: PartialMessage<GetGraphResponse>
  ) => Promise<ObjectDependency[]>;
}

export interface ServiceConfig {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  caFile?: string;
  rejectUnauthorized?: boolean;
}
