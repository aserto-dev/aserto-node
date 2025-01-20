// Unit tests for: serializeResponse

import { GetObjectResponse } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";

import { DsRegistry } from "../../../lib/directory/v3/serializer";
import { InvalidSchemaError } from "../../../lib/errors";

// Mock types
type MockGenMessage = {
  $typeName: string;
};

describe("DsRegistry.serializeResponse()", () => {
  let dsRegistry: DsRegistry;

  beforeEach(() => {
    dsRegistry = new DsRegistry();
  });

  it("serializes a valid response successfully", () => {
    const mockResponse: GetObjectResponse = {
      $typeName: "aserto.directory.reader.v3.GetObjectResponse",
      result: {
        $typeName: "aserto.directory.common.v3.Object",
        type: "user",
        id: "123",
        displayName: "",
        etag: "1234",
      },
      relations: [],
    };

    const result = dsRegistry.serializeResponse(mockResponse);

    expect(result).toEqual({
      relations: [],
      result: {
        id: "123",
        type: "user",
        displayName: "",
        etag: "1234",
      },
    });
  });

  it("throws InvalidSchemaError if schema is not registered", () => {
    const mockResponse: MockGenMessage = {
      $typeName: "invalid.type.name",
    };

    expect(() => dsRegistry.serializeResponse(mockResponse)).toThrow(
      new InvalidSchemaError(
        "schema not registered for type: [invalid.type.name]",
      ),
    );
  });
});
