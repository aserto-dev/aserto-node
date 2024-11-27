import {
  DecisionTreeOptionsSchema,
  PathSeparator,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { create } from "@bufbuild/protobuf";

const decisionTreeOptions = (pathSeparator: keyof typeof PathSeparator) => {
  const decisionTreeOptions = create(DecisionTreeOptionsSchema, {
    pathSeparator: PathSeparator[pathSeparator],
  });

  return decisionTreeOptions;
};

export default decisionTreeOptions;
