import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";

import { Authorizer } from "./authorizer";
import PolicyPathMapper from "./authorizer/mapper/policy/path";
import {
  IdentityMapper,
  PolicyMapper,
  ResourceMapper,
} from "./authorizer/middleware";
import policyContext from "./authorizer/model/policyContext";
import policyInstance from "./authorizer/model/policyInstance";
import { errorHandler } from "./errorHandler";
import identityContext from "./identityContext";
import processOptions from "./processOptions";
import { processParams } from "./processParams";

export type AuthzOptions = {
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
  caFile?: string;
};

const jwtAuthz = (
  optionsParam: AuthzOptions,
  packageName?: string,
  resourceMapper?: ResourceMapper,
  identityMapper?: IdentityMapper,
  policyMapper?: PolicyMapper
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const options = processOptions(optionsParam, req, res, next);
    if (!options) {
      return;
    }
    if (typeof options !== "object") {
      return options;
    }
    const {
      failWithError,
      authorizerUrl,
      authorizerApiKey,
      tenantId,
      instanceName,
      instanceLabel,
      policyRoot,
      identityContextOptions,
      authorizerCertCAFile,
      disableTlsValidation,
    } = options;

    const error = errorHandler(next, failWithError);

    // process the parameter values to extract policy and resourceContext
    const { policy, resourceContext } = await processParams(
      req,
      policyRoot,
      packageName,
      resourceMapper
    );

    const callAuthorizer = async () => {
      const client = new Authorizer({
        authorizerServiceUrl: authorizerUrl,
        tenantId: tenantId!,
        authorizerApiKey: authorizerApiKey!,
        caFile: authorizerCertCAFile,
        insecure: disableTlsValidation,
      });

      const identityCtx: IdentityContext = identityMapper
        ? await identityMapper(req)
        : identityContext(req, identityContextOptions);

      let policyCtx: PolicyContext;
      if (packageName) {
        const policy = packageName.replace(/\//g, ".");
        policyCtx = policyContext(policy);
      } else {
        policyCtx = policyMapper
          ? await policyMapper(req)
          : PolicyPathMapper(policyRoot, req);
      }

      const policyInst =
        instanceName && instanceLabel
          ? policyInstance(instanceName as string, instanceLabel as string)
          : undefined;

      return client.Is({
        identityContext: identityCtx,
        policyContext: policyCtx,
        policyInstance: policyInst,
        resourceContext: resourceContext,
      });
    };

    try {
      const allowed = await callAuthorizer();
      return allowed ? next() : error(res, `Forbidden by policy ${policy}`);
    } catch (err) {
      error(res, err as string);
    }
  };
};

export { jwtAuthz };
