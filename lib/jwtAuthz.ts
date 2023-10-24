import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";

import { Authorizer } from "./authorizer";
import PolicyPathMapper from "./authorizer/mapper/policy/path";
import ResourceParamsMapper from "./authorizer/mapper/resource/params";
import policyContext from "./authorizer/model/policyContext";
import policyInstance from "./authorizer/model/policyInstance";
import { errorHandler } from "./errorHandler";
import identityContext from "./identityContext";
import {
  AuthzOptions,
  IdentityMapper,
  PolicyMapper,
  ResourceMapper,
} from "./index.d";
import processOptions from "./processOptions";

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
      authorizerCert,
    } = options;

    const error = errorHandler(next, failWithError);

    const callAuthorizer = async () => {
      const client = new Authorizer(
        {
          authorizerServiceUrl: authorizerUrl,
          tenantId: tenantId!,
          authorizerApiKey: authorizerApiKey!,
        },
        authorizerCert
      );

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

      const resourceContext = resourceMapper
        ? typeof resourceMapper === "function"
          ? await resourceMapper(req)
          : resourceMapper
        : ResourceParamsMapper(req);

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
      return allowed ? next() : error(res, `Forbidden by policy ${policyRoot}`);
    } catch (err) {
      error(res, err as string);
    }
  };
};

export { jwtAuthz };
