import {
  QueryOptionsSchema,
  TraceLevel,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { create } from "@bufbuild/protobuf";

import { QueryOptions } from "../type";

const queryOptions = (
  options?: Omit<QueryOptions, "trace"> & {
    trace: keyof typeof TraceLevel;
  },
) => {
  const queryOptions = create(QueryOptionsSchema, {
    metrics: !!options?.metrics,
    instrument: !!options?.instrument,
    trace: TraceLevel[options?.trace || "OFF"],
    traceSummary: !!options?.traceSummary,
  });

  return queryOptions;
};

export default queryOptions;
