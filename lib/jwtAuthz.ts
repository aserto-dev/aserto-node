import {
  IsRequest,
  IsResponse,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";
import { AuthorizerClient } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { credentials, ServiceError, Metadata } from "@grpc/grpc-js";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { Request, NextFunction, Response } from "express";
import identityContext from "./identityContext";
import processOptions from "./processOptions";
import processParams from "./processParams";
import { log } from "./log";
import { AuthzOptions } from "./index.d";

const jwtAuthz = (
  optionsParam: AuthzOptions,
  packageName: string,
  resourceMap: object
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
    } = options;

    // process the parameter values to extract policy and resourceContext
    const { policy, resourceContext } = processParams(
      req,
      packageName,
      resourceMap,
      policyRoot
    );

    const error = (
      res: Response,
      err_message = "express-jwt-aserto: unknown error"
    ) => {
      if (failWithError) {
        return next({
          statusCode: 403,
          error: "Forbidden",
          message: err_message,
        });
      }

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

          const client = new AuthorizerClient(
            authorizerUrl,
            credentials.createInsecure()
          );
          const isRequest = new IsRequest();
          const policyContext = new PolicyContext();

          policyContext.setPath(policy);
          policyContext.setName(policyName);
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
                log(
                  `express-jwt-aserto: 'is' returned error: ${message}`,
                  "ERROR"
                );
                reject(null);
              }

              if (!response) {
                log(
                  `express-jwt-aserto: 'is' returned error: No response`,
                  "ERROR"
                );
                reject(false);
              }

              const result = response.toObject();
              const allowed =
                result.decisionsList &&
                result.decisionsList.length &&
                result.decisionsList[0].is;

              resolve(allowed);
            }
          );
        } catch (err) {
          log(`express-jwt-aserto: jwtAuthz caught exception ${err}`, "ERROR");
          // TODO: Fix error
          // error(res, err.message);
          return null;
        }
      });
    };

    const allowed = await callAuthorizer();
    if (allowed != null) {
      return allowed ? next() : error(res, `Forbidden by policy ${policy}`);
    }
  };
};

export { jwtAuthz };
