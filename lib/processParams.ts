// process parameters
import express from "express";

import { log } from "./log";

export default (
  req: express.Request,
  policyRoot: string,
  packageName?: string,
  resourceMap?: object
) => {
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
    packageName = `${req.method}${route}`;
    // TODO: Put back policy root
    log(`Should put this back${policyRoot}`);
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
