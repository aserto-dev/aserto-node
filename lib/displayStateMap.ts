import {
  DecisionTreeRequest,
  DecisionTreeResponse,
  DecisionTreeOptions,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import { AuthorizerClient } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { credentials, ServiceError, Metadata } from "@grpc/grpc-js";
import { Request, NextFunction, Response } from "express";
import identityContext from "./identityContext";
import processOptions from "./processOptions";
import { log } from "./log";
import { displayStateMap as displayStateMapD } from "./index.d";

const displayStateMap = (
  optionsParam: displayStateMapD.DisplayStateMapOptions
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
      policyName,
      policyRoot,
      identityContextOptions,
    } = options;

    const error = (
      res: Response,
      err_message = "express-jwt-aserto: unknown error"
    ) => {
      if (failWithError) {
        return next({
          statusCode: 403,
          error: "Forbidden",
          message: `express-jwt-aserto: ${err_message}`,
        });
      }

      res.status(403).send(err_message);
    };

    const callAuthorizer = async () => {
      return new Promise((resolve, reject) => {
        try {
          // process the parameter values to extract policy and resourceContext

          const metadata = new Metadata();
          authorizerApiKey &&
            metadata.add("authorization", `basic ${authorizerApiKey}`);
          tenantId && metadata.add("aserto-tenant-id", tenantId);

          const client = new AuthorizerClient(
            authorizerUrl,
            credentials.createInsecure()
          );

          const idContext = identityContext(req, identityContextOptions);

          const policyContext = new PolicyContext();
          policyContext.setPath(policyRoot);
          policyContext.setName(policyName);
          policyContext.setDecisionsList(["visible", "enabled"]);

          const decisionTreeRequest = new DecisionTreeRequest();
          const decisionTreeOptions = new DecisionTreeOptions();

          decisionTreeOptions.setPathSeparator(2);

          decisionTreeRequest.setPolicyContext(policyContext);
          decisionTreeRequest.setIdentityContext(idContext);
          decisionTreeRequest.setOptions(decisionTreeOptions);

          client.decisionTree(
            decisionTreeRequest,
            metadata,
            (err: ServiceError, response: DecisionTreeResponse) => {
              if (err) {
                const message = err.message;
                log(`'is' returned error: ${message}`, "ERROR");
                error(res, message);
                return null;
              }

              if (!response) {
                log(`'is' returned error: No response`, "ERROR");
                error(res, "No response");
                return false;
              }

              response.hasPath()
                ? resolve(response.getPath())
                : reject("No path found");
            }
          );
        } catch (e) {
          error(res, e as string);
        }
      });
    };

    try {
      const result = await callAuthorizer();
      res.send(200).send(result);
    } catch (e) {
      error(res, "Failed getting display state map");
    }
  };
};

export { displayStateMap };
