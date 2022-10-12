// process options map
import express from "express";
import { AuthzOptions, identityContext } from "./index.d";
const fs = require("fs");
const log = require("./log");

export default (
  options: AuthzOptions,
  req: express.Request,
  res?: express.Response,
  next?: express.NextFunction
) => {
  const error = (
    res: express.Response,
    err_message = "express-jwt-aserto: unknown error"
  ) => {
    if (options && options.failWithError && next) {
      return next({
        statusCode: 403,
        error: "Forbidden",
        message: `express-jwt-aserto: ${err_message}`,
      });
    }

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
  const authorizerUrl = `${authorizerServiceUrl}/api/v2/authz`;

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

  // set the authorizer cert file
  // TODO: Fix this type and default value
  let authorizerCertFile: string = "";
  if (
    options &&
    typeof options.authorizerCertFile === "string" &&
    options.authorizerCertFile
  ) {
    authorizerCertFile = options.authorizerCertFile;
  }

  let authorizerCert = null;
  if (!disableTlsValidation && authorizerCertFile) {
    const certfilesplit = authorizerCertFile.split("$HOME/");
    const certfile =
      certfilesplit.length > 1
        ? `${process.env.HOME}/${certfilesplit[1]}`
        : authorizerCertFile;
    try {
      authorizerCert = fs.readFileSync(certfile);
    } catch (e) {
      const text = `Certificate for CA not found at ${authorizerCertFile}. To disable TLS certificate validation, use the 'disableTlsValidation: true' option.`;
      log(text, "ERROR");
      return res && error(res, text);
    }
  }

  // set the policy ID
  const policyName =
    options && typeof options.policyName === "string" && options.policyName;
  if (!policyName && res) {
    return error(res, "must provide policyName in option map");
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
    options.customUserKey != null &&
    typeof options.customUserKey === "string"
  ) {
    userKey = options.customUserKey;
  }

  // set the subject key
  let subjectKey = "sub";
  if (
    options &&
    options.customSubjectKey != null &&
    typeof options.customSubjectKey === "string"
  ) {
    subjectKey = options.customSubjectKey;
  }

  /* @ts-ignore */
  //TODO: Remove the ts-ignore
  const subject = req[userKey] && req[userKey][subjectKey];

  return {
    failWithError,
    authorizerUrl,
    authorizerApiKey,
    tenantId,
    policyName: policyName as string,
    policyRoot: policyRoot as string,
    identityContextOptions: {
      useAuthorizationHeader,
      identity,
      subject,
    } as identityContext.Options,
    axiosOptions: {
      authorizerCert,
      disableTlsValidation,
    },
  };
};
