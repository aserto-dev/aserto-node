import { Request } from "express";
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

const is = (
  decision: string,
  req: Request,
  optionsParam: AuthzOptions,
  packageName?: string,
  resourceMap?: object
) => {
  return new Promise((resolve, reject) => {
    try {
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

      const metadata = new Metadata();
      authorizerApiKey &&
        metadata.add("authorization", `basic ${authorizerApiKey}`);
      tenantId && metadata.add("aserto-tenant-id", tenantId);

      const client = new AuthorizerClient(authorizerUrl, authorizerCert);

      const policyContext = new PolicyContext();
      policyContext.setPath(policy);
      policyName && policyContext.setName(policyName);
      policyContext.setDecisionsList([decision]);

      const isRequest = new IsRequest();
      isRequest.setPolicyContext(policyContext);

      const idContext = identityContext(req, identityContextOptions);
      isRequest.setIdentityContext(idContext);

      const fields = resourceContext as { [key: string]: JavaScriptValue };
      isRequest.setResourceContext(Struct.fromJavaScript(fields));

      client.is(
        isRequest,
        metadata,
        (err: ServiceError, response: IsResponse) => {
          if (err) {
            const message = `'is' returned error: ${err.message}`;
            log(message, "ERROR");
            reject(message);
            return;
          }

          if (!response) {
            const message = `'is' returned error: No response`;
            log(message, "ERROR");
            reject(message);
            return;
          }

          const result = response.getDecisionsList();
          const allowed = result && result.length && result[0]?.getIs();

          resolve(allowed);
        }
      );
    } catch (e) {
      log("'is' returned error:", e as string);
      reject(e);
    }
  });
};

export { is };
