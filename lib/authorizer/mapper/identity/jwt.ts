import { Request } from "express";
import jwt_decode from "jwt-decode";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "../../model/identityContext";

const JWTIdentityMapper = async (req: Request): Promise<IdentityContext> => {
  return new Promise((resolve, reject) => {
    try {
      // decode the JWT to make sure it's valid
      if (req.headers && req.headers.authorization) {
        jwt_decode(req.headers.authorization);
        const bearer = req.headers.authorization.split(" ")[1];
        if (bearer) {
          resolve(identityContext(bearer, "IDENTITY_TYPE_JWT"));
        } else {
          reject("Missing token");
        }
      } else {
        reject("Missing authorization header");
      }
    } catch (error) {
      reject(`Invalid JWT token: ${(error as Error).message}`);
    }
  });
};

export default JWTIdentityMapper;
