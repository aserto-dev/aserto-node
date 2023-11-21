import { Request } from "express";
import jwt_decode, { JwtPayload } from "jwt-decode";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import { IdentityMapper } from "../../middleware";
import identityContext from "../../model/identityContext";

const SubIdentityMapper = (
  header: string = "Authorization"
): IdentityMapper => {
  return async (req: Request): Promise<IdentityContext> => {
    const authHeader = req.header(header);
    if (authHeader) {
      if (header === "Authorization") {
        const token: JwtPayload = jwt_decode(authHeader);
        if (token && token.sub) {
          return identityContext(token.sub, "IDENTITY_TYPE_SUB");
        } else {
          throw new Error("Missing token");
        }
      } else {
        return identityContext(authHeader, "IDENTITY_TYPE_SUB");
      }
    } else {
      throw new Error(`Missing ${header} header`);
    }
  };
};

export default SubIdentityMapper;
