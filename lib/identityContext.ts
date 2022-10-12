// create identity context
import express from "express";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import { identityContext } from "./index.d";
import { log } from "./log";

//TODO: Should be an import?
const jwt_decode = require("jwt-decode");

export default (req: express.Request, options: identityContext.Options) => {
  const { useAuthorizationHeader, identity, subject } = options;

  // construct the identity context
  const identityContext = new IdentityContext();

  // set the identity context
  if (useAuthorizationHeader) {
    try {
      // decode the JWT to make sure it's valid
      const token = jwt_decode(req.headers.authorization);
      identityContext.setIdentity(token && token.sub);
      identityContext.setType(2);

      // instead of fishing out the subject, just pass the JWT itself
      // TODO: create a flag for choosing one behavior over another

      identityContext.setIdentity(
        req.headers.authorization
          ? req.headers.authorization.replace("Bearer ", "")
          : ""
      );

      identityContext.setType(3);
    } catch (error) {
      // TODO: resolve error type ${error.message}
      log(`Authorization header contained malformed JWT:`, "ERROR");
      identityContext.setType(1);
    }
  } else {
    if (subject) {
      // use the subject as the identity
      identityContext.setIdentity(subject);
      identityContext.setType(2);
    } else {
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
