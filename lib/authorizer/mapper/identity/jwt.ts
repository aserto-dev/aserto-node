import { Request } from "express";
import jwt_decode from "jwt-decode";

import identityContext from "../../model/identityContext";

const JWTIdentityMapper = async (req: Request) => {
  try {
    // decode the JWT to make sure it's valid
    if (req.headers && req.headers.authorization) {
      jwt_decode(req.headers.authorization);
      const bearer = req.headers.authorization.split(" ")[1];
      if (bearer) {
        return identityContext(bearer, "IDENTITY_TYPE_JWT");
      } else {
        throw new Error("Missing token");
      }
    } else {
      throw new Error("Missing authorization header");
    }
  } catch (error) {
    throw new Error(`Invalid JWT token: ${(error as Error).message}`);
  }
};

export default JWTIdentityMapper;
