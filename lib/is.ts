import { Request } from "express";

import { Authorizer } from "./authorizer";
import { ResourceMapper } from "./authorizer/middleware";
import policyContext from "./authorizer/model/policyContext";
import policyInstance from "./authorizer/model/policyInstance";
import identityContext from "./identityContext";
import { AuthzOptions } from "./jwtAuthz";
import processOptions from "./processOptions";
import { processParams } from "./processParams";

const is = async (
  decision: string,
  req: Request,
  optionsParam: AuthzOptions,
  packageName?: string,
  resourceMapper?: ResourceMapper
) => {
  const options = processOptions(optionsParam, req);
  if (!options) {
    return false;
  }

  if (typeof options !== "object") {
    return false;
  }
  const {
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

  // process the parameter values to extract policy and resourceContext
  const { policy, resourceContext } = await processParams(
    req,
    policyRoot,
    packageName,
    resourceMapper
  );

  const client = new Authorizer({
    authorizerServiceUrl: authorizerUrl,
    tenantId: tenantId!,
    authorizerApiKey: authorizerApiKey!,
    authorizerCertFile: authorizerCertCAFile,
    insecure: disableTlsValidation,
  });

  const policyCtx = policyContext(policy, [decision]);

  const policyInst =
    instanceName && instanceLabel
      ? policyInstance(instanceName as string, instanceLabel as string)
      : undefined;

  const identityCtx = identityContext(req, identityContextOptions);

  return client.Is({
    identityContext: identityCtx,
    policyContext: policyCtx,
    policyInstance: policyInst,
    resourceContext: resourceContext,
  });
};

export { is };
