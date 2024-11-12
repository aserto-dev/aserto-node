import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

import { AuthzOptions } from ".";
import { Authorizer } from "./authorizer";
import BodyResourceMapper from "./authorizer/mapper/resource/body";
import {
  IdentityMapper,
  PolicyMapper,
  ResourceMapper,
} from "./authorizer/middleware";
import decisionTreeOptions from "./authorizer/model/decisionTreeOptions";
import policyContext from "./authorizer/model/policyContext";
import policyInstance from "./authorizer/model/policyInstance";
import { errorHandler } from "./errorHandler";
import identityContext from "./identityContext";
import processOptions from "./processOptions";

type DisplayStateMapOptions = AuthzOptions & {
  endpointPath?: string;
};
const displayStateMap = (
  optionsParam: DisplayStateMapOptions,
  resourceMapper?: ResourceMapper,
  identityMapper?: IdentityMapper,
  policyMapper?: PolicyMapper,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let endpointPath = `/__displaystatemap`;

    if (
      optionsParam &&
      optionsParam.endpointPath !== null &&
      typeof optionsParam.endpointPath === "string"
    ) {
      endpointPath = optionsParam.endpointPath;
    }
    // bail if this isn't a request for the display state map endpoint
    if (req.path !== endpointPath) {
      next();
      return;
    }

    // process options parameter
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
      policyRoot,
      identityContextOptions,
      authorizerCertCAFile,
      disableTlsValidation,
    } = options;

    const error = errorHandler(next, failWithError);

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
      const policyCtx = policyMapper
        ? await policyMapper(req)
        : policyContext(policyRoot, ["visible", "enabled"]);

      const resourceContext = resourceMapper
        ? typeof resourceMapper === "function"
          ? await resourceMapper(req)
          : resourceMapper
        : BodyResourceMapper(req);

      const policyInst = instanceName
        ? policyInstance(instanceName)
        : undefined;

      const decisionTreeOpt = decisionTreeOptions("SLASH");

      return client.DecisionTree({
        identityContext: identityCtx,
        policyContext: policyCtx,
        policyInstance: policyInst,
        resourceContext: resourceContext,
        options: decisionTreeOpt,
      });
    };

    try {
      const result = await callAuthorizer();
      res.status(200).send(result?.path);
    } catch (err) {
      error(res, err as string);
    }
  };
};

export { displayStateMap };
