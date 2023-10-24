import { Request } from "express";

import policyContext from "../../model/policyContext";

const PolicyPathMapper = (policyRoot: string, req: Request) => {
  let route = req.route.path;

  // replace the Express.js ':param' convention with the '__param' Rego convention
  for (const param of Object.keys(req.params)) {
    route = route.replace(`:${param}`, `__${param}`);
  }

  // replace all '/' path components with '.' separators
  route = route.replace(/\//g, ".");

  // construct the policy name as appname.METHOD.route
  const packageName = `${policyRoot}.${req.method}${route}`;

  // replace all '/' path components with '.' separators
  const policyPath = packageName.replace(/\//g, ".");

  return policyContext(policyPath);
};
export default PolicyPathMapper;
