import { PolicyContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";

const policyContext = (
  policyPath: string = "",
  decisionsList: Array<string> = ["allowed"]
) => {
  const policyContext = new PolicyContext({
    path: policyPath,
    decisions: decisionsList,
  });

  return policyContext;
};

export default policyContext;
