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
      policyId,
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

    var metadata = new Metadata();
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
    policyContext.setName(policyId);
    policyContext.setDecisionsList([decision]);

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
          log(`express-jwt-aserto: 'is' returned error: ${message}`, "ERROR");
          return null;
        }

        if (!response) {
          return false;
        }

        const result = response.toObject();
        const allowed =
          result.decisionsList &&
          result.decisionsList.length &&
          result.decisionsList[0].is;

        console.log("ALLOWED", allowed);
        return allowed;
      }
    );
  } catch (e) {
    console.log("ERROR", e);
  }
};

export { is };
