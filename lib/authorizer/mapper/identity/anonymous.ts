import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "../../model/identityContext";

const AnonymousIdentityMapper = async (): Promise<IdentityContext> => {
  return identityContext("", "NONE");
};

export default AnonymousIdentityMapper;
