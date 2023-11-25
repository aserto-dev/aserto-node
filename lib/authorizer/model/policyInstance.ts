import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";

const policyInstance = (instanceName: string, instanceLabel: string) => {
  const policyInstance = new PolicyInstance();
  policyInstance.setInstanceLabel(instanceLabel);
  policyInstance.setName(instanceName);

  return policyInstance;
};

export default policyInstance;
