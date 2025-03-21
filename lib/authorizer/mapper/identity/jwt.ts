import { Request } from "express";
import { jwtDecode } from "jwt-decode";

import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

import { IdentityMapper } from "../../middleware";
import identityContext from "../../model/identityContext";

const JWTIdentityMapper = (
  header: string = "Authorization",
): IdentityMapper => {
  return async (req: Request): Promise<IdentityContext> => {
    const authHeader = req.header(header);
    if (authHeader) {
      // decode the JWT to make sure it's valid
      jwtDecode(authHeader);
      const bearer = authHeader.split(" ")[1];
      if (bearer && bearer !== "") {
        return identityContext(bearer, "JWT");
      } else {
        throw new Error("Missing token");
      }
    } else {
      throw new Error(`Missing ${header} header`);
    }
  };
};

export default JWTIdentityMapper;
