import * as express from "express";

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
    policyId: string;
    authorizerServiceUrl: string;
    authorizerApiKey?: string;
    tenantId?: string;
    authorizerCertFile?: string;
    disableTlsValidation?: boolean;
    useAuthorizationHeader?: boolean;
    identityHeader?: string;
    failWithError?: boolean;
    customUserKey?: string;
    customSubjectKey?: string;
  }
}

export interface AuthzOptions {
  policyRoot: string;
  policyId: string;
  authorizerServiceUrl: string;
  authorizerApiKey?: string;
  tenantId?: string;
  authorizerCertFile?: string;
  disableTlsValidation?: boolean;
  useAuthorizationHeader?: boolean;
  identityHeader?: string;
  failWithError?: boolean;
  customUserKey?: string;
  customSubjectKey?: string;
}

declare namespace identityContext {
  export interface Options {
    useAuthorizationHeader: boolean;
    identity: string;
    subject: string;
  }
}

export interface Value {
  kind?: string;
  nullValue?: number;
  numberValue?: number;
  stringValue?: string;
  boolValue?: boolean;
  structValue?: Struct;
  listValue?: ListValue;
}

export interface ListValue {
  values?: Value[];
}

export interface Struct {
  fields?: { [key: string]: Value };
}

export interface JsonArray extends Array<JsonValue> {}

/**
 * Matches any valid JSON value.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export type JsonObject = { [key: string]: JsonValue };
