import {
  DecisionTreeRequest as DecisionTreeRequest$,
  IsRequest as IsRequest$,
  QueryRequest as QueryRequest$,
} from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/authorizer_pb";
import { JsonObject, PlainMessage } from "@bufbuild/protobuf";

export type IsRequest = Omit<PlainMessage<IsRequest$>, "resourceContext"> & {
  resourceContext?: JsonObject;
};

export type QueryRequest = Omit<
  PlainMessage<QueryRequest$>,
  "resourceContext"
> & {
  resourceContext?: JsonObject;
};

export type DecisionTreeRequest = Omit<
  PlainMessage<DecisionTreeRequest$>,
  "resourceContext"
> & {
  resourceContext?: JsonObject;
};
