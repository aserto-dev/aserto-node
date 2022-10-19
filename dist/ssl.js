"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSSLCredentials = void 0;
const fs_1 = require("fs");
const grpc_js_1 = require("@grpc/grpc-js");
const getSSLCredentials = (ca) => {
    const root_cert = (0, fs_1.readFileSync)(ca); // new
    return grpc_js_1.credentials.createSsl(root_cert); // new
};
exports.getSSLCredentials = getSSLCredentials;
//# sourceMappingURL=ssl.js.map