import { PolicyContextSchema } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";
import { create } from "@bufbuild/protobuf";

const policyContext = (
  policyPath: string = "",
  decisionsList: Array<string> = ["allowed"],
) => {
  const policyContext = create(PolicyContextSchema, {
    path: policyPath,
    decisions: decisionsList,
  });

  return policyContext;
};

export default policyContext;
