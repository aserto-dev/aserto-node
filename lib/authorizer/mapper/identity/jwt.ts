import { Request } from "express";
import jwt_decode from "jwt-decode";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import { IdentityMapper } from "../../middleware";
import identityContext from "../../model/identityContext";

const JWTIdentityMapper = (
  header: string = "Authorization"
): IdentityMapper => {
  return async (req: Request): Promise<IdentityContext> => {
    const authHeader = req.header(header);
    if (authHeader) {
      // decode the JWT to make sure it's valid
      jwt_decode(authHeader);
      const bearer = authHeader.split(" ")[1];
      if (bearer && bearer !== "") {
        return identityContext(bearer, "IDENTITY_TYPE_JWT");
      } else {
        throw new Error("Missing token");
      }
    } else {
      throw new Error(`Missing ${header} header`);
    }
  };
};

export default JWTIdentityMapper;
