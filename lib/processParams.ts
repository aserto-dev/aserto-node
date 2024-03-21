// process parameters
import express from "express";

import { ResourceMapper } from "./authorizer/middleware";

export const processParams = async (
  req: express.Request,
  policyRoot: string,
  packageName?: string,
  resourceMap?: ResourceMapper
) => {
  // if a resourceMap wasn't explicitly passed in, get it from req.params
  if (!resourceMap) {
    resourceMap = req.params || {};
  } else if (typeof resourceMap === "function") {
    resourceMap = await resourceMap(req);
  }

  // if a package name was not provided, construct it from the route path
  if (!packageName) {
    let route = req.route.path;
    // replace the Express.js ':param' convention with the '__param' Rego convention
    for (const param of Object.keys(req.params)) {
      route = route.replace(`:${param}`, `__${param}`);
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
