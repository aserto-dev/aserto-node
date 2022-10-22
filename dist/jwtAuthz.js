"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuthz = void 0;
const struct_pb_1 = require("google-protobuf/google/protobuf/struct_pb");
const policy_context_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb");
const policy_instance_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb");
const authorizer_grpc_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb");
const authorizer_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb");
const grpc_js_1 = require("@grpc/grpc-js");
const errorHandler_1 = require("./errorHandler");
const identityContext_1 = __importDefault(require("./identityContext"));
const processOptions_1 = __importDefault(require("./processOptions"));
const processParams_1 = __importDefault(require("./processParams"));
const jwtAuthz = (optionsParam, packageName, resourceMap) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const options = (0, processOptions_1.default)(optionsParam, req, res, next);
        if (!options) {
            return;
        }
        if (typeof options !== "object") {
            return options;
        }
        const { failWithError, authorizerUrl, authorizerApiKey, tenantId, instanceName, instanceLabel, policyRoot, identityContextOptions, authorizerCert, } = options;
        // process the parameter values to extract policy and resourceContext
        const { policy, resourceContext } = (0, processParams_1.default)(req, policyRoot, packageName, resourceMap);
        const error = (0, errorHandler_1.errorHandler)(next, failWithError);
        const callAuthorizer = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const metadata = new grpc_js_1.Metadata();
                    authorizerApiKey &&
                        metadata.add("authorization", `basic ${authorizerApiKey}`);
                    tenantId && metadata.add("aserto-tenant-id", tenantId);
                    const client = new authorizer_grpc_pb_1.AuthorizerClient(authorizerUrl, authorizerCert);
                    const isRequest = new authorizer_pb_1.IsRequest();
                    const policyContext = new policy_context_pb_1.PolicyContext();
                    policyContext.setPath(policy);
                    policyContext.setDecisionsList(["allowed"]);
                    const idContext = (0, identityContext_1.default)(req, identityContextOptions);
                    isRequest.setPolicyContext(policyContext);
                    isRequest.setIdentityContext(idContext);
                    const fields = resourceContext;
                    isRequest.setResourceContext(struct_pb_1.Struct.fromJavaScript(fields));
                    if (instanceName && instanceLabel) {
                        const policyInstance = new policy_instance_pb_1.PolicyInstance();
                        policyInstance.setName(instanceName);
                        policyInstance.setInstanceLabel(instanceLabel);
                        isRequest.setPolicyInstance(policyInstance);
                    }
                    client.is(isRequest, metadata, (err, response) => {
                        var _a;
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
                        const allowed = result.decisionsList &&
                            result.decisionsList.length &&
                            ((_a = result.decisionsList[0]) === null || _a === void 0 ? void 0 : _a.is);
                        resolve(allowed);
                    });
                }
                catch (err) {
                    reject(`'jwtAuthz' caught exception ${err}`);
                }
            });
        });
        try {
            const allowed = yield callAuthorizer();
            return allowed ? next() : error(res, `Forbidden by policy ${policy}`);
        }
        catch (err) {
            error(res, err);
        }
    });
};
exports.jwtAuthz = jwtAuthz;
//# sourceMappingURL=jwtAuthz.js.map