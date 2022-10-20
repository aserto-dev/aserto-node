import { NextFunction, Request, Response } from "express";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";
import { AuthorizerClient } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb";
import {
  DecisionTreeOptions,
  DecisionTreeRequest,
  DecisionTreeResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import { Metadata, ServiceError } from "@grpc/grpc-js";

import { errorHandler } from "./errorHandler";
import identityContext from "./identityContext";
import { DisplayStateMapOptions } from "./index.d";
import processOptions from "./processOptions";

const displayStateMap = (optionsParam: DisplayStateMapOptions) => {
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
      authorizerCert,
    } = options;

    const error = errorHandler(next, failWithError);

    const callAuthorizer = async () => {
      return new Promise((resolve, reject) => {
        try {
          const metadata = new Metadata();
          authorizerApiKey &&
            metadata.add("authorization", `basic ${authorizerApiKey}`);
          tenantId && metadata.add("aserto-tenant-id", tenantId);

          const client = new AuthorizerClient(authorizerUrl, authorizerCert);

          const idContext = identityContext(req, identityContextOptions);

          const policyContext = new PolicyContext();
          policyContext.setPath(policyRoot);
          policyContext.setDecisionsList(["visible", "enabled"]);

          const decisionTreeRequest = new DecisionTreeRequest();
          const decisionTreeOptions = new DecisionTreeOptions();

          if (instanceName && instanceLabel) {
            const policyInstance = new PolicyInstance();
            policyInstance.setName(instanceName);
            policyInstance.setInstanceLabel(instanceLabel);
            decisionTreeRequest.setPolicyInstance(policyInstance);
          }

          decisionTreeOptions.setPathSeparator(2);

          decisionTreeRequest.setPolicyContext(policyContext);
          decisionTreeRequest.setIdentityContext(idContext);
          decisionTreeRequest.setOptions(decisionTreeOptions);

          client.decisionTree(
            decisionTreeRequest,
            metadata,
            (err: ServiceError, response: DecisionTreeResponse) => {
              if (err) {
                reject(`'displayStateMap' returned error: ${err.message}`);
                return;
              }

              if (!response) {
                reject(`'displayStateMap' returned error: No response`);
                return;
              }
              if (response.hasPath()) {
                resolve(response.getPath());
              } else {
                reject("'displayStateMap' returned error: No path found");
                return;
              }
            }
          );
        } catch (err) {
          reject(`'displayStateMap' caught exception ${err}`);
        }
      });
    };

    try {
      const result = await callAuthorizer();
      res.send(200).send(result);
    } catch (err) {
      error(res, err as string);
    }
  };
};

export { displayStateMap };
