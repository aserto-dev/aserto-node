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
exports.displayStateMap = void 0;
const policy_context_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb");
const policy_instance_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb");
const authorizer_grpc_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_grpc_pb");
const authorizer_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb");
const grpc_js_1 = require("@grpc/grpc-js");
const errorHandler_1 = require("./errorHandler");
const identityContext_1 = __importDefault(require("./identityContext"));
const processOptions_1 = __importDefault(require("./processOptions"));
const displayStateMap = (optionsParam) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        let endpointPath = `/__displaystatemap`;
        if (optionsParam &&
            optionsParam.endpointPath !== null &&
            typeof optionsParam.endpointPath === "string") {
            endpointPath = optionsParam.endpointPath;
        }
        // bail if this isn't a request for the display state map endpoint
        if (req.path !== endpointPath) {
            next();
            return;
        }
        // process options parameter
        const options = (0, processOptions_1.default)(optionsParam, req, res, next);
        if (!options) {
            return;
        }
        if (typeof options !== "object") {
            return options;
        }
        const { failWithError, authorizerUrl, authorizerApiKey, tenantId, instanceName, instanceLabel, policyRoot, identityContextOptions, authorizerCert, } = options;
        const error = (0, errorHandler_1.errorHandler)(next, failWithError);
        const callAuthorizer = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const metadata = new grpc_js_1.Metadata();
                    authorizerApiKey &&
                        metadata.add("authorization", `basic ${authorizerApiKey}`);
                    tenantId && metadata.add("aserto-tenant-id", tenantId);
                    const client = new authorizer_grpc_pb_1.AuthorizerClient(authorizerUrl, authorizerCert);
                    const idContext = (0, identityContext_1.default)(req, identityContextOptions);
                    const policyContext = new policy_context_pb_1.PolicyContext();
                    policyContext.setPath(policyRoot);
                    policyContext.setDecisionsList(["visible", "enabled"]);
                    const decisionTreeRequest = new authorizer_pb_1.DecisionTreeRequest();
                    const decisionTreeOptions = new authorizer_pb_1.DecisionTreeOptions();
                    if (instanceName && instanceLabel) {
                        const policyInstance = new policy_instance_pb_1.PolicyInstance();
                        policyInstance.setName(instanceName);
                        policyInstance.setInstanceLabel(instanceLabel);
                        decisionTreeRequest.setPolicyInstance(policyInstance);
                    }
                    decisionTreeOptions.setPathSeparator(2);
                    decisionTreeRequest.setPolicyContext(policyContext);
                    decisionTreeRequest.setIdentityContext(idContext);
                    decisionTreeRequest.setOptions(decisionTreeOptions);
                    client.decisionTree(decisionTreeRequest, metadata, (err, response) => {
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
                        }
                        else {
                            reject("'displayStateMap' returned error: No path found");
                            return;
                        }
                    });
                }
                catch (err) {
                    reject(`'displayStateMap' caught exception ${err}`);
                }
            });
        });
        try {
            const result = yield callAuthorizer();
            res.send(200).send(result);
        }
        catch (err) {
            error(res, err);
        }
    });
};
exports.displayStateMap = displayStateMap;
//# sourceMappingURL=displayStateMap.js.map