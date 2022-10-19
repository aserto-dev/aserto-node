"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.is = void 0;
const struct_pb_1 = require("google-protobuf/google/protobuf/struct_pb");
const policy_context_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb");
const authorizer_grpc_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb");
const authorizer_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb");
const grpc_js_1 = require("@grpc/grpc-js");
const identityContext_1 = __importDefault(require("./identityContext"));
const log_1 = require("./log");
const processOptions_1 = __importDefault(require("./processOptions"));
const processParams_1 = __importDefault(require("./processParams"));
const is = (decision, req, optionsParam, packageName, resourceMap) => {
    return new Promise((resolve, reject) => {
        try {
            const options = (0, processOptions_1.default)(optionsParam, req);
            if (!options) {
                return false;
            }
            if (typeof options !== "object") {
                return false;
            }
            const { authorizerUrl, authorizerApiKey, tenantId, policyName, policyRoot, identityContextOptions, authorizerCert, } = options;
            // process the parameter values to extract policy and resourceContext
            const { policy, resourceContext } = (0, processParams_1.default)(req, policyRoot, packageName, resourceMap);
            const metadata = new grpc_js_1.Metadata();
            authorizerApiKey &&
                metadata.add("authorization", `basic ${authorizerApiKey}`);
            tenantId && metadata.add("aserto-tenant-id", tenantId);
            const client = new authorizer_grpc_pb_1.AuthorizerClient(authorizerUrl, authorizerCert);
            const policyContext = new policy_context_pb_1.PolicyContext();
            policyContext.setPath(policy);
            policyName && policyContext.setName(policyName);
            policyContext.setDecisionsList([decision]);
            const isRequest = new authorizer_pb_1.IsRequest();
            isRequest.setPolicyContext(policyContext);
            const idContext = (0, identityContext_1.default)(req, identityContextOptions);
            isRequest.setIdentityContext(idContext);
            const fields = resourceContext;
            isRequest.setResourceContext(struct_pb_1.Struct.fromJavaScript(fields));
            client.is(isRequest, metadata, (err, response) => {
                var _a;
                if (err) {
                    const message = `'is' returned error: ${err.message}`;
                    (0, log_1.log)(message, "ERROR");
                    reject(message);
                    return;
                }
                if (!response) {
                    const message = `'is' returned error: No response`;
                    (0, log_1.log)(message, "ERROR");
                    reject(message);
                    return;
                }
                const result = response.getDecisionsList();
                const allowed = result && result.length && ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.getIs());
                resolve(allowed);
            });
        }
        catch (e) {
            (0, log_1.log)("'is' returned error:", e);
            reject(e);
        }
    });
};
exports.is = is;
//# sourceMappingURL=is.js.map