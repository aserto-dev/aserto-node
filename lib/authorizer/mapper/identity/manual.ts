import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "../../model/identityContext";

const ManualIdentityMapper = async (
  value: string
): Promise<IdentityContext> => {
  return identityContext(value, "IDENTITY_TYPE_MANUAL");
};

export default ManualIdentityMapper;
