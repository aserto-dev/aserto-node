import * as fs from "fs";
import { describe } from "node:test";
import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import { createAsyncIterable } from "@connectrpc/connect/protocol";
import * as connectNode from "@connectrpc/connect-node";

import {
  CheckResponseSchema,
  ConfigError,
  createImportRequest,
  DeleteManifestResponseSchema,
  DeleteObjectResponseSchema,
  DeleteRelationResponseSchema,
  DirectoryServiceV3,
  DirectoryV3,
  EtagMismatchError,
  ExportResponseSchema,
  GetGraphResponseSchema,
  GetManifestResponseSchema,
  GetObjectManyResponseSchema,
  GetObjectResponseSchema,
  GetObjectsResponseSchema,
  GetRelationResponseSchema,
  GetRelationsResponseSchema,
  ImportResponseSchema,
  InvalidArgumentError,
  NotFoundError,
  SetManifestResponseSchema,
  SetObjectResponseSchema,
  SetRelationResponseSchema,
} from "../../../lib/index";
jest.mock("fs");

describe("DirectoryV3", () => {
  const config = {
    url: "example.com",
    tenantId: "tenantId",
    apiKey: "apiKey",
  };
  const directory = DirectoryServiceV3(config);

  it("creates an instance of DirectoryV3 with valid config", () => {
    const config = {
      url: "example.com",
      tenantId: "tenantId",
      apiKey: "apiKey",
      customHeaders: {
        foo: "bar",
      },
    };
    const directory = DirectoryServiceV3(config);

    expect(directory).toBeInstanceOf(DirectoryV3);
    expect(directory.ReaderClient).toBeDefined();
    expect(directory.WriterClient).toBeDefined();
    expect(directory.ImporterClient).toBeDefined();
    expect(directory.ExporterClient).toBeDefined();
    expect(directory.ModelClient).toBeDefined();
  });

  it("handles multiple service configs", () => {
    const mockTransport = jest.spyOn(connectNode, "createGrpcTransport");
    const mockFs = jest
      .spyOn(fs, "readFileSync")
      .mockImplementation((path: fs.PathOrFileDescriptor) => {
        return path as string;
      });

    const config = {
      url: "directory.prod.aserto.com:8443",
      tenantId: "tenantId",
      apiKey: "apiKey",
      caFile: "caFile",
      customHeaders: {
        base: "bar",
      },
      reader: {
        url: "readerUrl",
        apiKey: "readerApiKey",
        tenantId: "readerTenantId",
        caFile: "readerCaFile",
        customHeaders: {
          reader: "bar",
        },
      },
      writer: {
        url: "writerUrl",
        apiKey: "writerApiKey",
        tenantId: "writerTenantId",
        customHeaders: {
          writer: "bar",
        },
      },
      importer: {
        url: "importerUrl",
        apiKey: "importerApiKey",
        tenantId: "importerTenantId",
      },
      exporter: {
        caFile: "exporterCaFile",
        customHeaders: {},
      },
      model: {
        apiKey: "modelApiKey",
        tenantId: "modelTenantId",
      },
      rejectUnauthorized: true,
    };

    const directory = DirectoryServiceV3(config);

    expect(mockTransport.mock.calls).toEqual([
      [
        expect.objectContaining({
          baseUrl: "https://directory.prod.aserto.com:8443",
          interceptors: [expect.any(Function)],
          nodeOptions: {
            ca: "caFile",
            rejectUnauthorized: true,
          },
        }),
      ],
      [
        expect.objectContaining({
          baseUrl: "https://readerUrl",
          interceptors: [expect.any(Function), expect.any(Function)],
          nodeOptions: {
            ca: "readerCaFile",
            rejectUnauthorized: true,
          },
        }),
      ],
      [
        expect.objectContaining({
          baseUrl: "https://writerUrl",
          interceptors: [expect.any(Function), expect.any(Function)],
          nodeOptions: {
            ca: "caFile",
            rejectUnauthorized: true,
          },
        }),
      ],
      [
        expect.objectContaining({
          baseUrl: "https://importerUrl",
          interceptors: [expect.any(Function), expect.any(Function)],
          nodeOptions: {
            ca: "caFile",
            rejectUnauthorized: true,
          },
        }),
      ],
      [
        expect.objectContaining({
          baseUrl: "https://directory.prod.aserto.com:8443",
          interceptors: [expect.any(Function), expect.any(Function)],
          nodeOptions: {
            ca: "exporterCaFile",
            rejectUnauthorized: true,
          },
        }),
      ],
      [
        expect.objectContaining({
          baseUrl: "https://directory.prod.aserto.com:8443",
          interceptors: [expect.any(Function), expect.any(Function)],
          nodeOptions: {
            ca: "caFile",
            rejectUnauthorized: true,
          },
        }),
      ],
    ]);

    expect(directory).toBeInstanceOf(DirectoryV3);
    expect(directory.ReaderClient).toBeDefined();
    expect(directory.WriterClient).toBeDefined();
    expect(directory.ImporterClient).toBeDefined();
    expect(directory.ExporterClient).toBeDefined();
    expect(directory.ModelClient).toBeDefined();

    mockTransport.mockReset();
    mockFs.mockReset();
  });

  it("handles same config for multiple services", () => {
    const config = {
      url: "directory.prod.aserto.com:8443",
      tenantId: "tenantId",
      apiKey: "apiKey",
      reader: {
        url: "readerUrl",
        apiKey: "readerApiKey",
        tenantId: "readerTenantId",
      },
      importer: {
        url: "readerUrl",
        apiKey: "readerApiKey",
      },
      exporter: {
        url: "exporterUrl",
        tenantId: "exporterTenantId",
      },
      model: {
        apiKey: "modelApiKey",
        tenantId: "modelTenantId",
      },
    };

    const directory = DirectoryServiceV3(config);

    expect(directory).toBeInstanceOf(DirectoryV3);
    expect(directory.ReaderClient).toBeDefined();
    expect(directory.WriterClient).toBeDefined();
    expect(directory.ImporterClient).toBeDefined();
    expect(directory.ExporterClient).toBeDefined();
    expect(directory.ModelClient).toBeDefined();
  });

  describe("Reader", () => {
    it("inherits base config", () => {
      const mockTransport = jest.spyOn(connectNode, "createGrpcTransport");
      const mockFs = jest
        .spyOn(fs, "readFileSync")
        .mockImplementation((path: fs.PathOrFileDescriptor) => {
          return path as string;
        });

      const directory = DirectoryServiceV3({
        tenantId: "tenantId",
        apiKey: "apiKey",
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.ReaderClient).toBeDefined();

      mockFs.mockReset();
      mockTransport.mockReset();
    });

    it("allows to be  configured individually", () => {
      const mockTransport = jest.spyOn(connectNode, "createGrpcTransport");
      const mockFs = jest
        .spyOn(fs, "readFileSync")
        .mockImplementation((path: fs.PathOrFileDescriptor) => {
          return path as string;
        });

      const directory = DirectoryServiceV3({
        reader: {
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.ReaderClient).toBeDefined();
      expect(mockTransport.mock.calls).toEqual([
        [
          expect.objectContaining({
            baseUrl: "https://directory.prod.aserto.com:8443",
            nodeOptions: { rejectUnauthorized: true },
          }),
        ],
      ]);
      mockFs.mockReset();
      mockTransport.mockReset();
    });

    it("overwrites base config", () => {
      const mockTransport = jest.spyOn(connectNode, "createGrpcTransport");
      const mockFs = jest
        .spyOn(fs, "readFileSync")
        .mockImplementation((path: fs.PathOrFileDescriptor) => {
          return path as string;
        });

      const directory = DirectoryServiceV3({
        reader: {
          url: "readerurl",
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.ReaderClient).toBeDefined();
      expect(mockTransport.mock.calls).toEqual([
        [
          expect.objectContaining({
            baseUrl: "https://readerurl",
            nodeOptions: { rejectUnauthorized: true },
          }),
        ],
      ]);
      mockFs.mockReset();
    });

    describe("when config is missing", () => {
      const directory = DirectoryServiceV3({
        writer: {
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      it("throws ClientNotConfigured Error when called", async () => {
        await expect(directory.objects({ objectType: "" })).rejects.toThrow(
          ConfigError,
        );

        await expect(directory.objects({ objectType: "" })).rejects.toThrow(
          `Cannot call 'getObjects', 'Reader' is not configured.`,
        );
      });
    });
  });

  describe("Writer", () => {
    it("inherits base config", () => {
      const directory = DirectoryServiceV3({
        tenantId: "tenantId",
        apiKey: "apiKey",
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.WriterClient).toBeDefined();
    });

    describe("when config is missing", () => {
      const directory = DirectoryServiceV3({
        reader: {
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      it("throws ClientNotConfigured Error when called", async () => {
        await expect(directory.setObject({})).rejects.toThrow(ConfigError);

        await expect(directory.setObject({})).rejects.toThrow(
          `Cannot call 'setObject', 'Writer' is not configured.`,
        );
      });
    });
  });

  describe("Importer", () => {
    it("inherits base config", () => {
      const directory = DirectoryServiceV3({
        tenantId: "tenantId",
        apiKey: "apiKey",
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.ImporterClient).toBeDefined();
    });

    describe("when config is missing", () => {
      const directory = DirectoryServiceV3({
        reader: {
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      it("throws ClientNotConfigured Error when called", async () => {
        await expect(directory.import(createImportRequest([]))).rejects.toThrow(
          ConfigError,
        );

        await expect(directory.import(createImportRequest([]))).rejects.toThrow(
          `Cannot call 'import', 'Importer' is not configured.`,
        );
      });
    });
  });

  describe("Exporter", () => {
    it("inherits base config", () => {
      const directory = DirectoryServiceV3({
        tenantId: "tenantId",
        apiKey: "apiKey",
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.ExporterClient).toBeDefined();
    });

    describe("when config is missing", () => {
      const directory = DirectoryServiceV3({
        reader: {
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      it("throws ClientNotConfigured Error when called", async () => {
        await expect(directory.export({ options: "DATA" })).rejects.toThrow(
          ConfigError,
        );

        await expect(directory.export({ options: "DATA" })).rejects.toThrow(
          `Cannot call 'export', 'Exporter' is not configured.`,
        );
      });
    });
  });

  describe("Model", () => {
    it("inherits base config", () => {
      const directory = DirectoryServiceV3({
        tenantId: "tenantId",
        apiKey: "apiKey",
      });

      expect(directory).toBeInstanceOf(DirectoryV3);
      expect(directory.ModelClient).toBeDefined();
    });

    describe("when config is missing", () => {
      const directory = DirectoryServiceV3({
        reader: {
          tenantId: "tenantId",
          apiKey: "apiKey",
        },
      });

      it("throws ClientNotConfigured Error when called", async () => {
        await expect(directory.deleteManifest()).rejects.toThrow(ConfigError);

        await expect(directory.deleteManifest()).rejects.toThrow(
          `Cannot call 'deleteManifest', 'Model' is not configured.`,
        );
      });
    });
  });

  describe("check", () => {
    it("calls check with valid params", async () => {
      const mockCheck = jest
        .spyOn(directory.ReaderClient, "check")
        .mockResolvedValue(
          create(CheckResponseSchema, { check: true, trace: [] }),
        );

      const params = {
        subjectId: "euang@acmecorp.com",
        subjectType: "user",
        relation: "read",
        objectType: "group",
        objectId: "admin",
      };
      const result = await directory.check(params);

      expect(directory.ReaderClient.check).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.reader.v3.CheckRequest",
          ...params,
          trace: false,
        },
        undefined,
      );
      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.CheckResponse",
        check: true,
        trace: [],
      });

      mockCheck.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockCheck = jest
        .spyOn(directory.ReaderClient, "check")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        subjectId: "euang@acmecorp.com",
        subjectType: "user",
        relation: "read",
        objectType: "group",
        objectId: "admin",
      };
      await expect(directory.check(params)).rejects.toThrow(
        "Directory service error",
      );

      mockCheck.mockReset();
    });
  });

  describe("object", () => {
    it("returns the expected object data", async () => {
      const mockGetObject = jest
        .spyOn(directory.ReaderClient, "getObject")
        .mockResolvedValue(
          create(GetObjectResponseSchema, {
            result: {
              id: "123",
            },
          }),
        );

      const params = { objectId: "123", objectType: "user" };
      const result = await directory.object(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectResponse",
        relations: [],
        result: {
          $typeName: "aserto.directory.common.v3.Object",
          displayName: "",
          etag: "",
          id: "123",
          type: "",
        },
      });

      mockGetObject.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetObject = jest
        .spyOn(directory.ReaderClient, "getObject")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectId: "123", objectType: "user" };
      await expect(directory.object(params)).rejects.toThrow(
        "Directory service error",
      );

      mockGetObject.mockReset();
    });

    it("handles NotFound Error", async () => {
      const mockGetObject = jest
        .spyOn(directory.ReaderClient, "getObject")
        .mockRejectedValue(new ConnectError("Not found", Code.NotFound));

      const params = { objectId: "123", objectType: "user" };

      // error class
      await expect(directory.object(params)).rejects.toThrow(NotFoundError);
      // error message
      await expect(directory.object(params)).rejects.toThrow(
        "object not found",
      );

      mockGetObject.mockReset();
    });
  });

  describe("objects", () => {
    it("returns objects of a given objectType", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockResolvedValue(create(GetObjectsResponseSchema, {}));

      const params = {
        objectType: "user",
      };

      await directory.objects(params);

      expect(mockGetObjects).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.reader.v3.GetObjectsRequest",
          ...params,
        },
        undefined,
      );
      const result = await directory.objects(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        results: [],
      });

      mockGetObjects.mockReset();
    });

    it("sets default page size", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockResolvedValue(create(GetObjectsResponseSchema, {}));

      const params = {
        objectType: "user",
        page: {
          token: "",
        },
      };

      await directory.objects(params);

      expect(mockGetObjects).toHaveBeenCalledWith(
        {
          ...params,
          $typeName: "aserto.directory.reader.v3.GetObjectsRequest",
          page: {
            $typeName: "aserto.directory.common.v3.PaginationRequest",
            token: "",
            size: 100,
          },
        },
        undefined,
      );
      const result = await directory.objects(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        results: [],
      });

      mockGetObjects.mockReset();
    });

    it("sets default page token", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockResolvedValue(create(GetObjectsResponseSchema, {}));

      const params = {
        objectType: "user",
        page: {
          size: 45,
        },
      };

      await directory.objects(params);

      expect(mockGetObjects).toHaveBeenCalledWith(
        {
          ...params,
          $typeName: "aserto.directory.reader.v3.GetObjectsRequest",
          page: {
            $typeName: "aserto.directory.common.v3.PaginationRequest",
            token: "",
            size: 45,
          },
        },
        undefined,
      );
      const result = await directory.objects(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        results: [],
      });

      mockGetObjects.mockReset();
    });

    it("respects page size", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockResolvedValue(create(GetObjectsResponseSchema, {}));

      const params = {
        objectType: "user",
        page: {
          token: "1234",
          size: 1,
        },
      };

      await directory.objects(params);

      expect(mockGetObjects).toHaveBeenCalledWith(
        {
          ...params,
          $typeName: "aserto.directory.reader.v3.GetObjectsRequest",
          page: {
            $typeName: "aserto.directory.common.v3.PaginationRequest",
            token: "1234",
            size: 1,
          },
        },
        undefined,
      );
      const result = await directory.objects(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        results: [],
      });

      mockGetObjects.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectType: "user" };
      await expect(directory.objects(params)).rejects.toThrow(
        "Directory service error",
      );

      mockGetObjects.mockReset();
    });
  });

  describe("setObject", () => {
    it("sets the object with the given parameters when calling setObject with valid parameters", async () => {
      const mockSetObject = jest
        .spyOn(directory.WriterClient, "setObject")
        .mockResolvedValue(create(SetObjectResponseSchema, {}));

      const params = {
        object: {
          id: "123",
          type: "user",
          displayName: "test",
          properties: {
            name: "John Doe",
            age: 30,
          },
        },
      };

      await directory.setObject(params);

      expect(mockSetObject).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.writer.v3.SetObjectRequest",
          object: {
            $typeName: "aserto.directory.common.v3.Object",
            id: "123",
            type: "user",
            displayName: "test",
            etag: "",
            properties: params.object?.properties || {},
          },
        },
        undefined,
      );

      mockSetObject.mockReset();
    });
    it("handles errors returned by the directory service", async () => {
      const mockSetObject = jest
        .spyOn(directory.WriterClient, "setObject")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        object: {
          type: "user",
          id: "test-user",
          properties: {
            displayName: "test user",
          },
        },
      };
      await expect(directory.setObject(params)).rejects.toThrow(
        "Directory service error",
      );

      mockSetObject.mockReset();
    });

    it("handles InvalidArgument Error", async () => {
      const mockSetObject = jest
        .spyOn(directory.WriterClient, "setObject")
        .mockRejectedValue(
          new ConnectError("Invalid argument", Code.InvalidArgument),
        );

      const params = {
        object: {
          type: "user",
          id: "test-user",
          properties: {
            displayName: "test user",
          },
        },
      };

      // error class
      await expect(directory.setObject(params)).rejects.toThrow(
        InvalidArgumentError,
      );
      // error message
      await expect(directory.setObject(params)).rejects.toThrow(
        "setObject: [invalid_argument] Invalid argument",
      );

      mockSetObject.mockReset();
    });

    it("handles EtagMissmatch Error", async () => {
      const mockSetObject = jest
        .spyOn(directory.WriterClient, "setObject")
        .mockRejectedValue(
          new ConnectError("Invalid argument", Code.FailedPrecondition),
        );

      const params = {
        object: {
          type: "user",
          id: "test-user",
          properties: {
            displayName: "test user",
          },
        },
      };

      // error class
      await expect(directory.setObject(params)).rejects.toThrow(
        EtagMismatchError,
      );
      // error message
      await expect(directory.setObject(params)).rejects.toThrow(
        "invalid etag in setObject request",
      );

      mockSetObject.mockReset();
    });
  });

  describe("objectMany", () => {
    it("returns the expected object data when calling objectMany with valid params", async () => {
      const mockGetObjectMany = jest
        .spyOn(directory.ReaderClient, "getObjectMany")
        .mockResolvedValue(create(GetObjectManyResponseSchema, {}));

      const params = { param: [{ objectType: "user", objectId: "123" }] };
      const result = await directory.objectMany(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectManyResponse",
        results: [],
      });

      mockGetObjectMany.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetObjectMany = jest
        .spyOn(directory.ReaderClient, "getObjectMany")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { param: [{ objectType: "user", objectId: "123" }] };
      await expect(directory.objectMany(params)).rejects.toThrow(
        "Directory service error",
      );

      mockGetObjectMany.mockReset();
    });
  });

  describe("graph", () => {
    it("calls graph with valid params and return expected response", async () => {
      const mockGetGraph = jest
        .spyOn(directory.ReaderClient, "getGraph")
        .mockResolvedValue(create(GetGraphResponseSchema, {}));

      const params = {
        objectId: "1234",
        objectType: "user",
        relation: "member",
        explain: true,
        trace: false,
      };
      const result = await directory.graph(params);

      expect(mockGetGraph).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.reader.v3.GetGraphRequest",
          subjectId: "",
          subjectRelation: "",
          subjectType: "",
          ...params,
        },
        undefined,
      );
      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetGraphResponse",
        results: [],
        trace: [],
      });

      mockGetGraph.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetGraph = jest
        .spyOn(directory.ReaderClient, "getGraph")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        objectId: "1234",
        objectType: "user",
        relation: "member",
      };
      await expect(directory.graph(params)).rejects.toThrow(
        "Directory service error",
      );

      mockGetGraph.mockReset();
    });
  });

  describe("deleteObject", () => {
    it("deletes object when valid parameters are provided", async () => {
      const mockDeleteObject = jest
        .spyOn(directory.WriterClient, "deleteObject")
        .mockResolvedValue(create(DeleteObjectResponseSchema, {}));

      const params = { objectId: "123", objectType: "user" };
      await directory.deleteObject(params);

      expect(directory.WriterClient.deleteObject).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.writer.v3.DeleteObjectRequest",
          ...params,
          withRelations: false,
        },
        undefined,
      );

      mockDeleteObject.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockDeleteObject = jest
        .spyOn(directory.WriterClient, "deleteObject")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectId: "123", objectType: "user" };
      await expect(directory.deleteObject(params)).rejects.toThrow(
        "Directory service error",
      );

      mockDeleteObject.mockReset();
    });
  });

  describe("relation", () => {
    it("returns the expected relation data", async () => {
      const mockGetRelation = jest
        .spyOn(directory.ReaderClient, "getRelation")
        .mockResolvedValue(
          create(GetRelationResponseSchema, {
            result: {
              subjectType: "user",
              subjectId: "123",
              objectType: "identity",
              objectId: "identity",
              relation: "identifier",
            },
          }),
        );

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
      };
      const result = await directory.relation(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetRelationResponse",
        result: {
          $typeName: "aserto.directory.common.v3.Relation",
          subjectType: "user",
          subjectId: "123",
          objectType: "identity",
          objectId: "identity",
          relation: "identifier",
          subjectRelation: "",
          etag: "",
        },
        objects: {},
      });

      mockGetRelation.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetRelation = jest
        .spyOn(directory.ReaderClient, "getRelation")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
      };
      await expect(directory.relation(params)).rejects.toThrow(
        "Directory service error",
      );

      mockGetRelation.mockReset();
    });
  });

  describe("relations", () => {
    it("returns relations", async () => {
      const mockGetRelations = jest
        .spyOn(directory.ReaderClient, "getRelations")
        .mockResolvedValue(create(GetRelationsResponseSchema, {}));

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
        page: {
          size: 2,
        },
      };

      await directory.relations(params);

      expect(mockGetRelations).toHaveBeenCalledWith(
        {
          ...params,
        },
        undefined,
      );
      const result = await directory.relations(params);

      expect(result).toEqual({
        $typeName: "aserto.directory.reader.v3.GetRelationsResponse",
        results: [],
        objects: {},
      });

      mockGetRelations.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetRelations = jest
        .spyOn(directory.ReaderClient, "getRelations")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
      };
      await expect(directory.relations(params)).rejects.toThrow(
        "Directory service error",
      );

      mockGetRelations.mockReset();
    });
  });

  describe("setRelation", () => {
    it("sets the relation with the given parameters when calling setRelation with valid parameters", async () => {
      const mockSetRelation = jest
        .spyOn(directory.WriterClient, "setRelation")
        .mockResolvedValue(create(SetRelationResponseSchema, {}));

      const params = {
        relation: {
          subjectType: "user",
          subjectId: "123",
          objectType: "identity",
          objectId: "identity",
          relation: "identifier",
        },
      };

      await directory.setRelation(params);

      expect(mockSetRelation).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.writer.v3.SetRelationRequest",
          relation: {
            $typeName: "aserto.directory.common.v3.Relation",
            etag: "",
            objectId: "identity",
            objectType: "identity",
            relation: "identifier",
            subjectId: "123",
            subjectRelation: "",
            subjectType: "user",
          },
        },
        undefined,
      );

      mockSetRelation.mockReset();
    });
    it("handles errors returned by the directory service", async () => {
      const mockSetRelation = jest
        .spyOn(directory.WriterClient, "setRelation")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        relation: {
          subjectType: "user",
          subjectId: "123",
          objectType: "identity",
          objectId: "identity",
          relation: "identifier",
        },
      };
      await expect(directory.setRelation(params)).rejects.toThrow(
        "Directory service error",
      );

      mockSetRelation.mockReset();
    });
  });

  describe("deleteRelation", () => {
    it("deletes relation when valid parameters are provided", async () => {
      const mockDeleteRelation = jest
        .spyOn(directory.WriterClient, "deleteRelation")
        .mockResolvedValue(
          create(DeleteRelationResponseSchema, { result: {} }),
        );

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
      };
      const result = await directory.deleteRelation(params);

      expect(directory.WriterClient.deleteRelation).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.writer.v3.DeleteRelationRequest",
          ...params,
          subjectRelation: "",
        },
        undefined,
      );
      expect(result).toEqual({
        $typeName: "aserto.directory.writer.v3.DeleteRelationResponse",
        result: { $typeName: "google.protobuf.Empty" },
      });

      mockDeleteRelation.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockDeleteRelation = jest
        .spyOn(directory.WriterClient, "deleteRelation")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
      };
      await expect(directory.deleteRelation(params)).rejects.toThrow(
        "Directory service error",
      );

      mockDeleteRelation.mockReset();
    });
  });

  describe("getManifest", () => {
    it("gets a Manifest", async () => {
      const getManifestMock = jest
        .spyOn(directory.ModelClient, "getManifest")
        .mockReturnValue(
          createAsyncIterable([
            create(GetManifestResponseSchema, {
              msg: {
                case: "metadata",
                value: {},
              },
            }),
            create(GetManifestResponseSchema, {
              msg: {
                case: "body",
                value: {
                  data: new TextEncoder().encode("test"),
                },
              },
            }),
          ]),
        );

      const result = await directory.getManifest();
      expect(result).toEqual({
        body: "test",
        etag: "",
        updatedAt: undefined,
      });

      getManifestMock.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const getManifestMock = jest
        .spyOn(directory.ModelClient, "getManifest")
        .mockImplementation(() => {
          throw new Error("Directory service error");
        });

      await expect(directory.getManifest()).rejects.toThrow(
        "Directory service error",
      );

      getManifestMock.mockReset();
    });
  });

  describe("setManifest", () => {
    it("sets a new Manifest", async () => {
      const mockSetManifest = jest
        .spyOn(directory.ModelClient, "setManifest")
        .mockResolvedValue(create(SetManifestResponseSchema, { result: {} }));

      const result = await directory.setManifest({ body: `a:\n b` });
      expect(result).toEqual({
        $typeName: "aserto.directory.model.v3.SetManifestResponse",
        result: { $typeName: "google.protobuf.Empty" },
      });

      mockSetManifest.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockSetManifest = jest
        .spyOn(directory.ModelClient, "setManifest")
        .mockRejectedValue(new Error("Directory service error"));

      await expect(directory.setManifest({ body: "" })).rejects.toThrow(
        "Directory service error",
      );

      mockSetManifest.mockReset();
    });
  });

  describe("deleteManifest", () => {
    it("deletes a Manifest", async () => {
      const mockDeleteManifest = jest
        .spyOn(directory.ModelClient, "deleteManifest")
        .mockResolvedValue(create(DeleteManifestResponseSchema, {}));

      const result = await directory.deleteManifest();
      expect(result).toEqual({
        $typeName: "aserto.directory.model.v3.DeleteManifestResponse",
      });

      mockDeleteManifest.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockDeleteManifest = jest
        .spyOn(directory.ModelClient, "deleteManifest")
        .mockRejectedValue(new Error("Directory service error"));

      await expect(directory.deleteManifest()).rejects.toThrow(
        "Directory service error",
      );

      mockDeleteManifest.mockReset();
    });
  });

  describe("import", () => {
    it("calls import with valid params and return expected response", async () => {
      const mockImport = jest
        .spyOn(directory.ImporterClient, "import")
        .mockReturnValue(
          createAsyncIterable([create(ImportResponseSchema, {})]),
        );

      await directory.import(createImportRequest([]));

      expect(mockImport).toHaveBeenCalledWith(
        expect.objectContaining({}),
        undefined,
      );

      mockImport.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockImport = jest
        .spyOn(directory.ImporterClient, "import")
        .mockImplementation(() => {
          throw new Error("Directory service error");
        });

      await expect(directory.import(createImportRequest([]))).rejects.toThrow(
        "Directory service error",
      );

      mockImport.mockReset();
    });
  });

  describe("export", () => {
    it("calls export with valid params and return expected response", async () => {
      const mockExport = jest
        .spyOn(directory.ExporterClient, "export")
        .mockReturnValue(
          createAsyncIterable([create(ExportResponseSchema, {})]),
        );

      await directory.export({ options: "DATA" });

      expect(mockExport).toHaveBeenCalledWith(
        {
          $typeName: "aserto.directory.exporter.v3.ExportRequest",
          options: 24,
        },
        undefined,
      );

      mockExport.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockExport = jest
        .spyOn(directory.ExporterClient, "export")
        .mockImplementation(() => {
          throw new Error("Directory service error");
        });

      await expect(directory.export({ options: "DATA" })).rejects.toThrow(
        "Directory service error",
      );

      mockExport.mockReset();
    });
  });
});
