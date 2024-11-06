import {
  QueryOptions,
  TraceLevel,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { PartialMessage } from "@bufbuild/protobuf";

const queryOptions = (
  options?: Omit<PartialMessage<QueryOptions>, "trace"> & {
    trace: keyof typeof TraceLevel;
  },
) => {
  const queryOptions = new QueryOptions({
    metrics: !!options?.metrics,
    instrument: !!options?.instrument,
    trace: TraceLevel[options?.trace || "OFF"],
    traceSummary: !!options?.traceSummary,
  });

  return queryOptions;
};

export default queryOptions;
