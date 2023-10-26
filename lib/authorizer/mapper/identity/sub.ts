import { Request } from "express";
import jwt_decode, { JwtPayload } from "jwt-decode";

import identityContext from "../../model/identityContext";

const SubIdentityMapper = async (req: Request) => {
  try {
    // decode the JWT to make sure it's valid
    if (req.headers && req.headers.authorization) {
      const token: JwtPayload = jwt_decode(req.headers.authorization);
      if (token && token.sub) {
        return identityContext(token.sub, "IDENTITY_TYPE_SUB");
      } else {
        throw new Error("Invalid JWT token, missing sub");
      }
    } else {
      throw new Error("Missing authorization header");
    }
  } catch (error) {
    throw new Error(`Invalid JWT token: ${(error as Error).message}`);
  }
};

export default SubIdentityMapper;
