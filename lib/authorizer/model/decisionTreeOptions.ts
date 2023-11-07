import {
  DecisionTreeOptions,
  PathSeparator,
  PathSeparatorMap,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";

const decisionTreeOptions = (pathSeparator: keyof PathSeparatorMap) => {
  const decisionTreeOptions = new DecisionTreeOptions();
  decisionTreeOptions.setPathSeparator(PathSeparator[pathSeparator]);

  return decisionTreeOptions;
};

export default decisionTreeOptions;
