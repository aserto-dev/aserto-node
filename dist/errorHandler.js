"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const log_1 = require("./log");
const errorHandler = (next, failWithError) => (res, err_message = "aserto-node: unknown error") => {
    {
        if (failWithError) {
            return next({
                statusCode: 403,
                error: "Forbidden",
                message: `aserto-node: ${err_message}`,
            });
        }
        (0, log_1.log)(err_message, "ERROR");
        res.append("WWW-Authenticate", `Bearer error="${encodeURIComponent(err_message)}"`);
        res.status(403).send(err_message);
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map