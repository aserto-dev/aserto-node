import {
  IdentityContextSchema,
  IdentityType,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
import { create } from "@bufbuild/protobuf";

const identityContext = (value: string, type: keyof typeof IdentityType) => {
  const identityContext = create(IdentityContextSchema, {
    identity: value,
    type: IdentityType[type],
  });

  return identityContext;
};

export default identityContext;
