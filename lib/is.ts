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
import { Request } from "express";
import identityContext from "./identityContext";
import processOptions from "./processOptions";
import processParams from "./processParams";
import { AuthzOptions } from "./index.d";
import { log } from "./log";

const is = (
  decision: string,
  req: Request,
  optionsParam: AuthzOptions,
  packageName: string,
  resourceMap: object
) => {
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
    } = options;

    // process the parameter values to extract policy and resourceContext
    const { policy, resourceContext } = processParams(
      req,
      packageName,
      resourceMap,
      policyRoot
    );

    const metadata = new Metadata();
    authorizerApiKey &&
      metadata.add("authorization", `basic ${authorizerApiKey}`);
    tenantId && metadata.add("aserto-tenant-id", tenantId);

    const client = new AuthorizerClient(
      authorizerUrl,
      credentials.createInsecure()
    );

    const policyContext = new PolicyContext();
    policyContext.setPath(policy);
    policyContext.setName(policyName);
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
          const message = err.message;
          log(`'is' returned error: ${message}`, "ERROR");
          return null;
        }

        if (!response) {
          log(`'is' returned error: No response`, "ERROR");
          return false;
        }

        const result = response.getDecisionsList();
        const allowed = result && result.length && result[0].getIs();

        return allowed;
      }
    );
  } catch (e) {
    console.log("ERROR", e);
  }
};

export { is };
