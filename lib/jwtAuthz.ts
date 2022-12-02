import { NextFunction, Request, Response } from "express";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";
import { AuthorizerClient } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb";
import {
  IsRequest,
  IsResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import { Metadata, ServiceError } from "@grpc/grpc-js";

import { errorHandler } from "./errorHandler";
import identityContext from "./identityContext";
import { AuthzOptions, ResourceMapper } from "./index.d";
import processOptions from "./processOptions";
import { processParams } from "./processParams";

const jwtAuthz = (
  optionsParam: AuthzOptions,
  packageName?: string,
  resourceMap?: ResourceMapper
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

    // process the parameter values to extract policy and resourceContext
    const { policy, resourceContext } = await processParams(
      req,
      policyRoot,
      packageName,
      resourceMap
    );

    const error = errorHandler(next, failWithError);

    const callAuthorizer = async () => {
      return new Promise((resolve, reject) => {
        try {
          const metadata = new Metadata();
          authorizerApiKey &&
            metadata.add("authorization", `basic ${authorizerApiKey}`);
          tenantId && metadata.add("aserto-tenant-id", tenantId);

          const client = new AuthorizerClient(authorizerUrl, authorizerCert);
          const isRequest = new IsRequest();
          const policyContext = new PolicyContext();

          policyContext.setPath(policy);
          policyContext.setDecisionsList(["allowed"]);

          const idContext = identityContext(req, identityContextOptions);

          isRequest.setPolicyContext(policyContext);
          isRequest.setIdentityContext(idContext);

          const fields = resourceContext as { [key: string]: JavaScriptValue };
          isRequest.setResourceContext(Struct.fromJavaScript(fields));

          if (instanceName && instanceLabel) {
            const policyInstance = new PolicyInstance();
            policyInstance.setName(instanceName);
            policyInstance.setInstanceLabel(instanceLabel);
            isRequest.setPolicyInstance(policyInstance);
          }
          client.is(
            isRequest,
            metadata,
            (err: ServiceError, response: IsResponse) => {
              if (err) {
                const message = err.message;
                reject(`'jwtAuthz' returned error: ${message}`);
                return;
              }

              if (!response) {
                reject("'jwtAuthz' returned error: No response");
                return;
              }

              const result = response.toObject();
              const allowed =
                result.decisionsList &&
                result.decisionsList.length &&
                result.decisionsList[0]?.is;

              resolve(allowed);
            }
          );
        } catch (err) {
          reject(`'jwtAuthz' caught exception ${err}`);
        }
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
