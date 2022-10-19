"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identity_context_pb_1 = require("@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb");
const log_1 = require("./log");
const jwt_decode = require("jwt-decode");
exports.default = (req, options) => {
    const { useAuthorizationHeader, identity, subject } = options;
    // construct the identity context
    const identityContext = new identity_context_pb_1.IdentityContext();
    // set the identity context
    if (useAuthorizationHeader) {
        try {
            // decode the JWT to make sure it's valid
            const token = jwt_decode(req.headers.authorization);
            identityContext.setIdentity(token && token.sub);
            identityContext.setType(2);
            // instead of fishing out the subject, just pass the JWT itself
            // TODO: create a flag for choosing one behavior over another
            identityContext.setIdentity(req.headers.authorization
                ? req.headers.authorization.replace("Bearer ", "")
                : "");
            identityContext.setType(3);
        }
        catch (error) {
            // TODO: resolve error type ${error.message}
            (0, log_1.log)(`Authorization header contained malformed JWT:`, "ERROR");
            identityContext.setType(1);
        }
    }
    else {
        if (subject) {
            // use the subject as the identity
            identityContext.setIdentity(subject);
            identityContext.setType(2);
        }
        else {
            // fall back to anonymous context
            identityContext.setType(1);
        }
    }
    // if provided, use the identity header as the identity override
    if (identity) {
        identityContext.setIdentity(identity);
        identityContext.setType(2);
    }
    return identityContext;
};
//# sourceMappingURL=identityContext.js.map