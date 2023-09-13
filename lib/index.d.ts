import * as express from "express";
import {
  Object$,
  ObjectDependency,
  ObjectIdentifier,
  ObjectTypeIdentifier,
  PaginationRequest,
  Relation,
  RelationIdentifier,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v2/common_pb";
import {
  GetGraphRequest,
  GetObjectManyRequest,
  GetObjectResponse,
  GetObjectsResponse,
  GetRelationsResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_pb";
import { Empty, JsonValue, PlainMessage } from "@bufbuild/protobuf";

import {
  CheckPermissionRequest,
  CheckRelationRequest,
  SetObjectRequest,
  SetRelationRequest,
} from "./ds";
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
  checkPermission: (params: CheckPermissionRequest) => Promise<boolean>;
  checkRelation: (params: CheckRelationRequest) => Promise<boolean>;
  object: (params: PlainMessage<ObjectIdentifier>) => Promise<Object$>;
  objects: (params: {
    objectType: PlainMessage<ObjectTypeIdentifier>;
    page?: PlainMessage<PaginationRequest>;
  }) => Promise<GetObjectsResponse>;
  objectMany: (
    params: PlainMessage<GetObjectManyRequest>
  ) => Promise<Object$[]>;
  setObject: (params: SetObjectRequest) => Promise<Object$>;
  deleteObject: (
    params: PlainMessage<ObjectIdentifier>
  ) => Promise<Empty | undefined>;
  relation: (params: PlainMessage<RelationIdentifier>) => Promise<Relation[]>;
  setRelation: (params: SetRelationRequest) => Promise<Relation | undefined>;
  deleteRelation: (
    params: PlainMessage<RelationIdentifier>
  ) => Promise<Empty | undefined>;
  relations: (
    params: PlainMessage<RelationIdentifier>
  ) => Promise<GetRelationsResponse>;
  graph: (params: PlainMessage<GetGraphRequest>) => Promise<ObjectDependency[]>;
}

export interface ServiceConfig {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  caFile?: string;
  rejectUnauthorized?: boolean;
}
