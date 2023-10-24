import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";

export default (instaneName: string, instanceLabel: string) => {
  const policyInstance = new PolicyInstance();
  policyInstance.setInstanceLabel(instanceLabel);
  policyInstance.setName(instaneName);

  return policyInstance;
};
