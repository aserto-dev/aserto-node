import {
  QueryOptions,
  TraceLevel,
  TraceLevelMap,
} from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/authorizer_pb";

const queryOptions = (
  options?: Omit<QueryOptions.AsObject, "trace"> & {
    trace: keyof TraceLevelMap;
  }
) => {
  const queryOptions = new QueryOptions();
  queryOptions.setMetrics(!!options?.metrics);
  queryOptions.setInstrument(!!options?.instrument);
  queryOptions.setTrace(TraceLevel[options?.trace || "TRACE_LEVEL_OFF"]);
  queryOptions.setTraceSummary(!!options?.traceSummary);

  return queryOptions;
};

export default queryOptions;
