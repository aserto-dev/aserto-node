import {
  DecisionTreeOptions,
  PathSeparator,
  PathSeparatorMap,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";

export default (pathSeparator: keyof PathSeparatorMap) => {
  const decisionTreeOptions = new DecisionTreeOptions();
  decisionTreeOptions.setPathSeparator(PathSeparator[pathSeparator]);
  return decisionTreeOptions;
};
