// process options map
import express from "express";

import { IdentityContextOptions } from "./identityContext";
import { AuthzOptions } from "./jwtAuthz";
import { defaultLogger } from "./log";

export default (
  options: AuthzOptions,
  req: express.Request,
  res?: express.Response,
  next?: express.NextFunction,
) => {
  const error = (
    res: express.Response,
    err_message = "aserto-node: unknown error",
  ) => {
    if (options && options.failWithError && next) {
      return next({
        statusCode: 403,
        error: "Forbidden",
        message: `aserto-node: ${err_message}`,
      });
    }
    defaultLogger.error(err_message);
    res.status(403).send(err_message);
  };

  // set the authorizer URL
  const authorizerServiceUrl =
    options &&
    typeof options.authorizerServiceUrl === "string" &&
    options.authorizerServiceUrl;
  if (!authorizerServiceUrl && res) {
    return error(res, "must provide authorizerServiceUrl in option map");
  }
  let authorizerUrl = `${authorizerServiceUrl}`;
  // strip any https:// or http:// prefix since this is a gRPC address
  if (authorizerUrl.startsWith("https://")) {
    authorizerUrl = authorizerUrl.split("https://")[1]!;
  }
  if (authorizerUrl.startsWith("http://")) {
    authorizerUrl = authorizerUrl.split("http://")[1]!;
  }

  // set the authorizer API key
  let authorizerApiKey = null;
  if (
    options &&
    typeof options.authorizerApiKey === "string" &&
    options.authorizerApiKey
  ) {
    authorizerApiKey = options.authorizerApiKey;
  }

  // set the tenant ID
  let tenantId = null;
  if (options && typeof options.tenantId === "string" && options.tenantId) {
    tenantId = options.tenantId;
  }

  // set the disableTlsValidation flag
  let disableTlsValidation = false;
  if (
    options &&
    options.disableTlsValidation !== null &&
    typeof options.disableTlsValidation === "boolean"
  ) {
    disableTlsValidation = options.disableTlsValidation;
  }

  const authorizerCertCAFile =
    options.authorizerCertCAFile || options.caFile || "";

  const instanceName =
    options && typeof options.instanceName === "string" && options.instanceName;

  if (!instanceName && res) {
    return error(res, "must provide  an instance name in option map");
  }
  // set the policy root
  const policyRoot =
    options && typeof options.policyRoot === "string" && options.policyRoot;

  if (!policyRoot && res) {
    return error(res, "must provide policyRoot in option map");
  }

  // set the identity header
  let identityHeader = "identity";
  if (
    options &&
    options.identityHeader !== null &&
    typeof options.identityHeader === "string"
  ) {
    identityHeader = options.identityHeader;
  }

  // set the identity based on what is in the identity header (if anything)
  const identity = req.headers[identityHeader];

  // set the useAuthorizationHeader flag
  let useAuthorizationHeader = true;
  if (
    options &&
    options.useAuthorizationHeader !== null &&
    typeof options.useAuthorizationHeader === "boolean"
  ) {
    useAuthorizationHeader = options.useAuthorizationHeader;
  }

  // set the failWithError flag
  let failWithError = false;
  if (
    options &&
    options.failWithError !== null &&
    typeof options.failWithError === "boolean"
  ) {
    failWithError = options.failWithError;
  }

  // set the user key
  let userKey = "user";
  if (
    options &&
    options.customUserKey !== null &&
    typeof options.customUserKey === "string"
  ) {
    userKey = options.customUserKey;
  }

  // set the subject key
  let subjectKey = "sub";
  if (
    options &&
    options.customSubjectKey !== null &&
    typeof options.customSubjectKey === "string"
  ) {
    subjectKey = options.customSubjectKey;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /* @ts-ignore */
  //TODO: Remove the ts-ignore
  const subject = req[userKey] && req[userKey][subjectKey];

  return {
    failWithError,
    authorizerUrl,
    authorizerApiKey,
    tenantId,
    instanceName,
    authorizerCertCAFile,
    disableTlsValidation,
    policyRoot: policyRoot! as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    identityContextOptions: {
      useAuthorizationHeader,
      identity,
      subject,
    } as IdentityContextOptions,
  };
};
