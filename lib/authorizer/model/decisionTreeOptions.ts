import {
  DecisionTreeOptions,
  PathSeparator,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";

const decisionTreeOptions = (pathSeparator: keyof typeof PathSeparator) => {
  const decisionTreeOptions = new DecisionTreeOptions({
    pathSeparator: PathSeparator[pathSeparator],
  });

  return decisionTreeOptions;
};

export default decisionTreeOptions;
