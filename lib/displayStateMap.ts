import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
import { Struct } from "@bufbuild/protobuf";

import { Authorizer } from "./authorizer";
import ResourceParamsMapper from "./authorizer/mapper/resource/params";
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

interface DisplayStateMapOptions {
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
const displayStateMap = (
  optionsParam: DisplayStateMapOptions,
  resourceMapper?: ResourceMapper,
  identityMapper?: IdentityMapper,
  policyMapper?: PolicyMapper
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
      instanceLabel,
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
        authorizerCertFile: authorizerCertCAFile,
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
        : ResourceParamsMapper(req);

      const policyInst =
        instanceName && instanceLabel
          ? policyInstance(instanceName as string, instanceLabel as string)
          : undefined;

      const decisionTreeOpt = decisionTreeOptions("SLASH");

      return client.DecisionTree({
        identityContext: identityCtx,
        policyContext: policyCtx,
        policyInstance: policyInst,
        resourceContext: Struct.fromJson(resourceContext),
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
