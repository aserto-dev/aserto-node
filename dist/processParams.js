"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (req, policyRoot, packageName, resourceMap) => {
    // if a resourceMap wasn't explicitly passed in, get it from req.params
    if (!resourceMap) {
        resourceMap = req.params;
    }
    // if a package name was not provided, construct it from the route path
    if (!packageName) {
        let route = req.route.path;
        // replace the Express.js ':param' convention with the '__param' Rego convention
        if (resourceMap) {
            for (const key of Object.keys(resourceMap)) {
                route = route.replace(`:${key}`, `__${key}`);
            }
        }
        // replace all '/' path components with '.' separators
        route = route.replace(/\//g, ".");
        // construct the policy name as appname.METHOD.route
        packageName = `${policyRoot}.${req.method}${route}`;
    }
    // replace all '/' path components with '.' separators
    const policy = packageName.replace(/\//g, ".");
    // return a resource based on the resourceMap, or an empty map
    const resourceContext = resourceMap || {};
    return {
        policy,
        resourceContext,
    };
};
//# sourceMappingURL=processParams.js.map