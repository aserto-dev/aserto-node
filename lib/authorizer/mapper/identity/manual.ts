import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

import identityContext from "../../model/identityContext";

const ManualIdentityMapper = async (
  value: string
): Promise<IdentityContext> => {
  return identityContext(value, "MANUAL");
};

export default ManualIdentityMapper;
