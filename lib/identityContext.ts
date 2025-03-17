// create identity context
import express from "express";
import { jwtDecode } from "jwt-decode";

import { IdentityType } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "./authorizer/model/identityContext";
import { log } from "./log";

export interface IdentityContextOptions {
  useAuthorizationHeader: boolean;
  identity: string;
  subject: string;
}

export default (req: express.Request, options: IdentityContextOptions) => {
  const { useAuthorizationHeader, identity, subject } = options;

  // construct the identity context
  let localIdentity: string = "";
  let type: keyof typeof IdentityType;

  // set the identity context
  if (useAuthorizationHeader) {
    try {
      // decode the JWT to make sure it's valid
      const token = jwtDecode(req.headers.authorization || "");
      localIdentity = (token && token.sub) || "";
      type = "SUB";

      // instead of fishing out the subject, just pass the JWT itself
      // TODO: create a flag for choosing one behavior over another

      localIdentity = req.headers.authorization
        ? req.headers.authorization.replace("Bearer ", "")
        : "";

      type = "JWT";

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // TODO: resolve error type ${error.message}
      log(`Authorization header contained malformed JWT:`, "ERROR");
      type = "NONE";
    }
  } else {
    if (subject) {
      // use the subject as the identity
      localIdentity = subject;
      type = "SUB";
    } else {
      // fall back to anonymous context
      type = "NONE";
    }
  }

  // if provided, use the identity header as the identity override
  if (identity) {
    localIdentity = identity;
    type = "SUB";
  }

  const identityCtx = identityContext(localIdentity, type);

  return identityCtx;
};
