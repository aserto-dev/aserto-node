import { NextFunction, Request, Response } from "express";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { AuthorizerClient } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb";
import {
  IsRequest,
  IsResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import { Metadata, ServiceError } from "@grpc/grpc-js";

import identityContext from "./identityContext";
import { AuthzOptions } from "./index.d";
import { log } from "./log";
import processOptions from "./processOptions";
import processParams from "./processParams";

const jwtAuthz = (
  optionsParam: AuthzOptions,
  packageName?: string,
  resourceMap?: object
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
      policyName,
      policyRoot,
      identityContextOptions,
      authorizerCert,
    } = options;

    // process the parameter values to extract policy and resourceContext
    const { policy, resourceContext } = processParams(
      req,
      policyRoot,
      packageName,
      resourceMap
    );

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
      log(err_message, "ERROR");

      res.append(
        "WWW-Authenticate",
        `Bearer error="${encodeURIComponent(err_message)}"`
      );
      res.status(403).send(err_message);
    };

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
          policyName && policyContext.setName(policyName);
          policyContext.setDecisionsList(["allowed"]);

          const idContext = identityContext(req, identityContextOptions);

          isRequest.setPolicyContext(policyContext);
          isRequest.setIdentityContext(idContext);

          const fields = resourceContext as { [key: string]: JavaScriptValue };
          isRequest.setResourceContext(Struct.fromJavaScript(fields));

          client.is(
            isRequest,
            metadata,
            (err: ServiceError, response: IsResponse) => {
              if (err) {
                const message = err.message;
                log(`'is' returned error: ${message}`, "ERROR");
                reject(null);
              }

              if (!response) {
                log(`'is' returned error: No response`, "ERROR");
                reject(false);
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
          log(`jwtAuthz caught exception ${err}`, "ERROR");
          return null;
        }
      });
    };

    const allowed = await callAuthorizer();
    if (allowed !== null) {
      return allowed ? next() : error(res, `Forbidden by policy ${policy}`);
    }
  };
};

export { jwtAuthz };
