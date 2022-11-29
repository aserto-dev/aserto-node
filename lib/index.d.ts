import * as express from "express";
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
  object: (params: ObjectParams) => Promise<Obj>;
  relation: (params: GetRelationParams) => Promise<Obj>;
}

export interface ServiceConfig {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  caFile?: string;
}
