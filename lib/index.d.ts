import * as express from "express";

export = {
  jwtAuthz,
  displayStateMap,
  is,
  IdentityContextOptions,
  DisplayStateMapOptions,
};

declare function jwtAuthz(
  options: jwtAuthz.AuthzOptions,
  policyRoot?: jwtAuthz.Policy,
  resourceMap?: jwtAuthz.ResourceMap
): express.Handler;

declare namespace jwtAuthz {
  export type Policy = string;
  export type ResourceMap = Record<string, string>;

  export interface AuthzOptions {
    policyRoot: string;
    policyName: string;
    authorizerServiceUrl: string;
    authorizerApiKey?: string;
    tenantId?: string;
    authorizerCertCAFile: string;
    disableTlsValidation?: boolean;
    useAuthorizationHeader?: boolean;
    identityHeader?: string;
    failWithError?: boolean;
    customUserKey?: string;
    customSubjectKey?: string;
  }
}

declare function displayStateMap(
  options: displayStateMap.DisplayStateMapOptions
): express.Handler;

export interface DisplayStateMapOptions {
  policyRoot: string;
  policyName: string;
  authorizerServiceUrl: string;
  authorizerApiKey?: string;
  tenantId?: string;
  authorizerCertCAFile: string;
  disableTlsValidation?: boolean;
  useAuthorizationHeader?: boolean;
  identityHeader?: string;
  failWithError?: boolean;
  customUserKey?: string;
  customSubjectKey?: string;
  endpointPath?: string;
}
declare function is(
  decision: string,
  req: express.Request,
  options: is.AuthzOptions,
  policy?: is.Policy,
  resourceMap?: is.ResourceMap
): boolean;

declare namespace is {
  export type Policy = string;
  export type ResourceMap = Record<string, string>;

  export interface AuthzOptions {
    policyRoot: string;
    policyName?: string;
    authorizerServiceUrl: string;
    authorizerApiKey?: string;
    tenantId?: string;
    authorizerCertCAFile: string;
    disableTlsValidation?: boolean;
    useAuthorizationHeader?: boolean;
    identityHeader?: string;
    failWithError?: boolean;
    customUserKey?: string;
    customSubjectKey?: string;
  }
}

declare namespace displayStateMap {
  export interface DisplayStateMapOptions {
    policyRoot: string;
    policyName?: string;
    authorizerServiceUrl: string;
    authorizerApiKey?: string;
    tenantId?: string;
    authorizerCertCAFile: string;
    disableTlsValidation?: boolean;
    useAuthorizationHeader?: boolean;
    identityHeader?: string;
    failWithError?: boolean;
    customUserKey?: string;
    customSubjectKey?: string;
    endpointPath?: string;
  }
}

export interface AuthzOptions {
  policyRoot: string;
  policyName?: string;
  authorizerServiceUrl: string;
  authorizerApiKey?: string;
  tenantId?: string;
  authorizerCertCAFile: string;
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
