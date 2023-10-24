import { Request } from "express";

import identityContext from "../../model/identityContext";

const AnonymousIdentityMapper = (_req: Request) => {
  return identityContext("", "IDENTITY_TYPE_NONE");
};

export default AnonymousIdentityMapper;
