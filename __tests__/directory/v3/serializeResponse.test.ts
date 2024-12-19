// Unit tests for: serializeResponse

import { file_aserto_directory_common_v3_common } from "@aserto/node-directory/src/gen/cjs/aserto/directory/common/v3/common_pb";
import { file_aserto_directory_exporter_v3_exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import { file_aserto_directory_importer_v3_importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import { file_aserto_directory_model_v3_model } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import {
  file_aserto_directory_reader_v3_reader,
  GetObjectResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import { file_aserto_directory_writer_v3_writer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import { createRegistry, Registry } from "@bufbuild/protobuf";
import { file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";

import { InvalidSchemaError } from "../../../lib";
import { serializeResponse } from "../../../lib/directory/v3/serializer";

type MockGenMessage = {
  $typeName: string;
  [key: string]: unknown;
};

const mockRegistry: Registry = createRegistry(
  file_aserto_directory_common_v3_common,
  file_aserto_directory_reader_v3_reader,
  file_aserto_directory_writer_v3_writer,
  file_aserto_directory_exporter_v3_exporter,
  file_aserto_directory_importer_v3_importer,
  file_aserto_directory_model_v3_model,
  file_google_protobuf_timestamp,
);

describe("serializeResponse() serializeResponse method", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should serialize a valid response object", () => {
    const mockResponse: GetObjectResponse = {
      $typeName: "aserto.directory.reader.v3.GetObjectResponse",
      result: {
        $typeName: "aserto.directory.common.v3.Object",
        type: "user",
        id: "123",
        displayName: "",
        etag: "",
      },
      relations: [],
    };

    const result = serializeResponse(mockResponse);

    expect(result).toEqual({
      result: {
        id: "123",
        type: "user",
      },
    });
  });
});

it("should throw InvalidSchemaError if schema is not found", () => {
  const mockResponse: MockGenMessage = {
    $typeName: "invalid.type.name",
  };

  jest.spyOn(mockRegistry, "getMessage").mockReturnValue(undefined);

  expect(() => serializeResponse(mockResponse)).toThrow(
    new InvalidSchemaError(
      "schema not registered for type: [invalid.type.name]",
    ),
  );
});
