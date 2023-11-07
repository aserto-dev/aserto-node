import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "../../model/identityContext";

const AnonymousIdentityMapper = async (): Promise<IdentityContext> => {
  return identityContext("", "IDENTITY_TYPE_NONE");
};

export default AnonymousIdentityMapper;
