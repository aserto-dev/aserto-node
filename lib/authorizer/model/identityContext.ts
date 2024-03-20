import {
  IdentityContext,
  IdentityType,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";

const identityContext = (value: string, type: keyof typeof IdentityType) => {
  const identityContext = new IdentityContext({
    identity: value,
    type: IdentityType[type],
  });

  return identityContext;
};

export default identityContext;
