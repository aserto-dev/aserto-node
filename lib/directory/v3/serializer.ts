import { file_aserto_directory_common_v3_common } from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
import { file_aserto_directory_exporter_v3_exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import { file_aserto_directory_importer_v3_importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import { file_aserto_directory_model_v3_model } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import { file_aserto_directory_reader_v3_reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import { file_aserto_directory_writer_v3_writer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import type { Registry } from "@bufbuild/protobuf";
import {
  createRegistry,
  Message,
  MessageShape,
  toJson,
} from "@bufbuild/protobuf";
import { GenMessage } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";

import { InvalidSchemaError } from "../../errors";

const registry: Registry = createRegistry(
  file_aserto_directory_common_v3_common,
  file_aserto_directory_reader_v3_reader,
  file_aserto_directory_writer_v3_writer,
  file_aserto_directory_exporter_v3_exporter,
  file_aserto_directory_importer_v3_importer,
  file_aserto_directory_model_v3_model,
  file_google_protobuf_timestamp,
);

/**
 * Serializes a response message into JSON format based on its schema.
 *
 * @param response - The message object to be serialized, adhering to MessageShape.
 * @returns The serialized message in JSON format.
 * @throws InvalidSchemaError if the schema for the given message type is not registered.
 */
export function serializeResponse<T extends Message>(
  response: MessageShape<GenMessage<T>>,
): T {
  const schema = registry.getMessage(response.$typeName);
  if (!schema) {
    throw new InvalidSchemaError(
      `schema not registered for type: [${response.$typeName}]`,
    );
  }
  return toJson(schema, response) as unknown as T;
}
