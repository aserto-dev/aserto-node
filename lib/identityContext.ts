// create identity context
import express from "express";
import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

import { log } from "./log";

export interface IdentityContextOptions {
  useAuthorizationHeader: boolean;
  identity: string;
  subject: string;
}

const jwt_decode = require("jwt-decode");

export default (req: express.Request, options: IdentityContextOptions) => {
  const { useAuthorizationHeader, identity, subject } = options;

  // construct the identity context
  let localIdentity, type;

  // set the identity context
  if (useAuthorizationHeader) {
    try {
      // decode the JWT to make sure it's valid
      const token = jwt_decode(req.headers.authorization);
      localIdentity = token && token.sub;
      type = 2;

      // instead of fishing out the subject, just pass the JWT itself
      // TODO: create a flag for choosing one behavior over another

      localIdentity = req.headers.authorization
        ? req.headers.authorization.replace("Bearer ", "")
        : "";

      type = 3;
    } catch (error) {
      // TODO: resolve error type ${error.message}
      log(`Authorization header contained malformed JWT:`, "ERROR");
      type = 1;
    }
  } else {
    if (subject) {
      // use the subject as the identity
      localIdentity = subject;
      type = 2;
    } else {
      // fall back to anonymous context
      type = 1;
    }
  }

  // if provided, use the identity header as the identity override
  if (identity) {
    localIdentity = identity;
    type = 2;
  }

  const identityContext = new IdentityContext({
    identity: localIdentity,
    type: type,
  });

  return identityContext;
};
