import { PolicyInstanceSchema } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";
import { create } from "@bufbuild/protobuf";

const policyInstance = (
  instanceName: string,
  instanceLabel: string = instanceName,
) => {
  const policyInstance = create(PolicyInstanceSchema, {
    name: instanceName,
    instanceLabel: instanceName || instanceLabel,
  });

  return policyInstance;
};

export default policyInstance;
