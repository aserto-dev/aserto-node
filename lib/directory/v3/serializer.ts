import { ExportResponseSchema } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import { ImportResponseSchema } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import {
  DeleteManifestResponseSchema,
  GetManifestResponseSchema,
  SetManifestResponseSchema,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import {
  CheckResponseSchema,
  GetGraphResponseSchema,
  GetObjectManyResponseSchema,
  GetObjectResponseSchema,
  GetObjectsResponseSchema,
  GetRelationResponseSchema,
  GetRelationsResponseSchema,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import {
  DeleteObjectResponseSchema,
  DeleteRelationResponseSchema,
  SetObjectResponseSchema,
  SetRelationResponseSchema,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import { DescMessage, Message, MessageShape, toJson } from "@bufbuild/protobuf";
import { GenMessage } from "@bufbuild/protobuf/codegenv1";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";

import { InvalidSchemaError } from "../../errors";

const schemaMap: { [key: string]: DescMessage } = {
  "aserto.directory.reader.v3.CheckResponse": CheckResponseSchema,
  "aserto.directory.reader.v3.GetObjectResponse": GetObjectResponseSchema,
  "aserto.directory.reader.v3.GetObjectsResponse": GetObjectsResponseSchema,
  "aserto.directory.reader.v3.GetObjectManyResponse":
    GetObjectManyResponseSchema,
  "aserto.directory.reader.v3.GetRelationResponse": GetRelationResponseSchema,
  "aserto.directory.reader.v3.GetRelationsResponse": GetRelationsResponseSchema,
  "aserto.directory.reader.v3.GetGraphResponse": GetGraphResponseSchema,
  "aserto.directory.writer.v3.SetObjectResponse": SetObjectResponseSchema,
  "aserto.directory.writer.v3.DeleteObjectResponse": DeleteObjectResponseSchema,
  "aserto.directory.writer.v3.SetRelationResponse": SetRelationResponseSchema,
  "aserto.directory.writer.v3.DeleteRelationResponse":
    DeleteRelationResponseSchema,
  "aserto.directory.importer.v3.ImportResponse": ImportResponseSchema,
  "aserto.directory.exporter.v3.ExportResponse": ExportResponseSchema,
  "aserto.directory.model.v3.GetManifestResponse": GetManifestResponseSchema,
  "aserto.directory.model.v3.SetManifestResponse": SetManifestResponseSchema,
  "aserto.directory.model.v3.DeleteManifestResponse":
    DeleteManifestResponseSchema,
  "google.protobuf.Timestamp": TimestampSchema,
};

export function serializeResponse<T extends Message>(
  response: MessageShape<GenMessage<T>>,
): T {
  const schema = schemaMap[response.$typeName];
  if (!schema) {
    throw new InvalidSchemaError(
      `invalid schema for type: [${response.$typeName}]`,
    );
  }
  return toJson(schema, response, { alwaysEmitImplicit: true }) as unknown as T;
}
