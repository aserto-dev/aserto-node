import { Request } from "express";
import jwt_decode, { JwtPayload } from "jwt-decode";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "../../model/identityContext";

const SubIdentityMapper = async (req: Request): Promise<IdentityContext> => {
  return new Promise((resolve, reject) => {
    try {
      // decode the JWT to make sure it's valid
      if (req.headers && req.headers.authorization) {
        const token: JwtPayload = jwt_decode(req.headers.authorization);
        if (token && token.sub) {
          resolve(identityContext(token.sub, "IDENTITY_TYPE_SUB"));
        } else {
          reject("Invalid JWT token, missing sub");
        }
      } else {
        reject("Missing authorization header");
      }
    } catch (error) {
      reject(`Invalid JWT token: ${(error as Error).message}`);
    }
  });
};

export default SubIdentityMapper;
