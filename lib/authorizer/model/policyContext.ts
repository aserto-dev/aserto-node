import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";

const policyContext = (
  policyPath: string = "",
  decisionsList: Array<string> = ["allowed"]
) => {
  const policyContext = new PolicyContext();
  policyContext.setPath(policyPath);
  policyContext.setDecisionsList(decisionsList);

  return policyContext;
};

export default policyContext;
