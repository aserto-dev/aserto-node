import {
  IdentityContext,
  IdentityType,
  IdentityTypeMap,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";

export default (value: string, type: keyof IdentityTypeMap) => {
  const identityContext = new IdentityContext();
  identityContext.setIdentity(value);
  identityContext.setType(IdentityType[type]);

  return identityContext;
};
