import { PolicyInstance } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";

const policyInstance = (
  instanceName: string,
  instanceLabel: string = instanceName
) => {
  const policyInstance = new PolicyInstance({
    name: instanceName,
    instanceLabel: instanceName || instanceLabel,
  });

  return policyInstance;
};

export default policyInstance;
