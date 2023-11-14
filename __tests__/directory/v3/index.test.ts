import {
  DeleteManifestResponse,
  GetManifestResponse,
  SetManifestResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import {
  CheckPermissionResponse,
  CheckRelationResponse,
  GetObjectResponse,
  GetObjectsResponse,
  GetRelationResponse,
  GetRelationsResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import {
  DeleteObjectResponse,
  DeleteRelationResponse,
  SetObjectResponse,
  SetRelationResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import { Struct } from "@bufbuild/protobuf";
import { createAsyncIterable } from "@connectrpc/connect/protocol";

import { DirectoryServiceV3 } from "../../../lib/index";

describe("DirectoryV3", () => {
  const config = {
    url: "example.com",
    tenantId: "tenantId",
    apiKey: "apiKey",
  };
  const directory = DirectoryServiceV3(config);

  describe("checkPermission", () => {
    it("calls checkPermission with valid params", async () => {
      const mockCheckPermission = jest
        .spyOn(directory.ReaderClient, "checkPermission")
        .mockResolvedValue(
          new CheckPermissionResponse({ check: true, trace: [] })
        );

      const params = {
        subjectId: "euang@acmecorp.com",
        subjectType: "user",
        permission: "read",
        objectType: "group",
        objectId: "admin",
      };
      const result = await directory.checkPermission(params);

      expect(directory.ReaderClient.checkPermission).toHaveBeenCalledWith(
        params
      );

      expect(result).toBe(true);

      mockCheckPermission.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockCheckPermission = jest
        .spyOn(directory.ReaderClient, "checkPermission")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        subjectId: "euang@acmecorp.com",
        subjectType: "user",
        permission: "read",
        objectType: "group",
        objectId: "admin",
      };
      await expect(directory.checkPermission(params)).rejects.toThrow(
        "Directory service error"
      );

      mockCheckPermission.mockReset();
    });
  });

  describe("checkRelation", () => {
    it("calls checkRelation with valid params", async () => {
      const mockCheckRelation = jest
        .spyOn(directory.ReaderClient, "checkRelation")
        .mockResolvedValue(
          new CheckRelationResponse({ check: true, trace: [] })
        );

      const params = {
        subjectId: "euang@acmecorp.com",
        subjectType: "user",
        relation: "read",
        objectType: "group",
        objectId: "admin",
      };
      const result = await directory.checkRelation(params);

      expect(directory.ReaderClient.checkRelation).toHaveBeenCalledWith(params);
      expect(result).toBe(true);

      mockCheckRelation.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockCheckRelation = jest
        .spyOn(directory.ReaderClient, "checkRelation")
        .mockRejectedValue(new Error("Directory service error"));

      const params = {
        subjectId: "euang@acmecorp.com",
        subjectType: "user",
        relation: "read",
        objectType: "group",
        objectId: "admin",
      };
      await expect(directory.checkRelation(params)).rejects.toThrow(
        "Directory service error"
      );

      mockCheckRelation.mockReset();
    });
  });

  describe("object", () => {
    it("returns the expected object data", async () => {
      const mockGetObject = jest
        .spyOn(directory.ReaderClient, "getObject")
        .mockResolvedValue(
          new GetObjectResponse({
            result: {
              id: "123",
            },
          })
        );

      const params = { objectId: "123", objectType: "user" };
      const result = await directory.object(params);

      expect(result).toEqual({
        displayName: "",
        etag: "",
        id: "123",
        type: "",
      });

      mockGetObject.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetObject = jest
        .spyOn(directory.ReaderClient, "getObject")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectId: "123", objectType: "user" };
      await expect(directory.object(params)).rejects.toThrow(
        "Directory service error"
      );

      mockGetObject.mockReset();
    });
  });

  describe("objects", () => {
    it("returns objects of a given objectType", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockResolvedValue(new GetObjectsResponse());

      const params = {
        objectType: "user",
      };

      await directory.objects(params);

      expect(mockGetObjects).toHaveBeenCalledWith(params);
      const result = await directory.objects(params);

      expect(result).toEqual({ results: [] });

      mockGetObjects.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockGetObjects = jest
        .spyOn(directory.ReaderClient, "getObjects")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectType: "user" };
      await expect(directory.objects(params)).rejects.toThrow(
        "Directory service error"
      );

      mockGetObjects.mockReset();
    });
  });

  describe("setObject", () => {
    it("sets the object with the given parameters when calling setObject with valid parameters", async () => {
      const mockSetObject = jest
        .spyOn(directory.WriterClient, "setObject")
        .mockResolvedValue(new SetObjectResponse());

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

      expect(mockSetObject).toHaveBeenCalledWith({
        object: {
          id: "123",
          type: "user",
          displayName: "test",
          etag: "",
          properties: Struct.fromJsonString(
            JSON.stringify(params.object?.properties || {})
          ),
        },
      });

      mockSetObject.mockReset();
    });
    it("handles errors returned by the directory service", async () => {
      const mockSetObject = jest
        .spyOn(directory.WriterClient, "setObject")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectType: "user" };
      await expect(directory.setObject(params)).rejects.toThrow(
        "Directory service error"
      );

      mockSetObject.mockReset();
    });
  });

  describe("deleteObject", () => {
    it("deletes object when valid parameters are provided", async () => {
      const mockDeleteObject = jest
        .spyOn(directory.WriterClient, "deleteObject")
        .mockResolvedValue(new DeleteObjectResponse());

      const params = { objectId: "123", objectType: "user" };
      await directory.deleteObject(params);

      expect(directory.WriterClient.deleteObject).toHaveBeenCalledWith(params);

      mockDeleteObject.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockDeleteObject = jest
        .spyOn(directory.WriterClient, "deleteObject")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectId: "123", objectType: "user" };
      await expect(directory.deleteObject(params)).rejects.toThrow(
        "Directory service error"
      );

      mockDeleteObject.mockReset();
    });
  });

  describe("relation", () => {
    it("returns the expected relation data", async () => {
      const mockGetRelation = jest
        .spyOn(directory.ReaderClient, "getRelation")
        .mockResolvedValue(
          new GetRelationResponse({
            result: {
              subjectType: "user",
              subjectId: "123",
              objectType: "identity",
              objectId: "identity",
              relation: "identifier",
            },
          })
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
        result: {
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
        "Directory service error"
      );

      mockGetRelation.mockReset();
    });
  });

  describe("relations", () => {
    it("returns relations", async () => {
      const mockGetRelations = jest
        .spyOn(directory.ReaderClient, "getRelations")
        .mockResolvedValue(new GetRelationsResponse());

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

      expect(mockGetRelations).toHaveBeenCalledWith(params);
      const result = await directory.relations(params);

      expect(result).toEqual({ results: [], objects: {} });

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
        "Directory service error"
      );

      mockGetRelations.mockReset();
    });
  });

  describe("setRelation", () => {
    it("sets the relation with the given parameters when calling setRelation with valid parameters", async () => {
      const mockSetRelation = jest
        .spyOn(directory.WriterClient, "setRelation")
        .mockResolvedValue(new SetRelationResponse());

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

      expect(mockSetRelation).toHaveBeenCalledWith({
        relation: {
          subjectType: "user",
          subjectId: "123",
          objectType: "identity",
          objectId: "identity",
          relation: "identifier",
        },
      });

      mockSetRelation.mockReset();
    });
    it("handles errors returned by the directory service", async () => {
      const mockSetRelation = jest
        .spyOn(directory.WriterClient, "setRelation")
        .mockRejectedValue(new Error("Directory service error"));

      const params = { objectType: "user" };
      await expect(directory.setRelation(params)).rejects.toThrow(
        "Directory service error"
      );

      mockSetRelation.mockReset();
    });
  });

  describe("deleteRelation", () => {
    it("deletes relation when valid parameters are provided", async () => {
      const mockDeleteRelation = jest
        .spyOn(directory.WriterClient, "deleteRelation")
        .mockResolvedValue(new DeleteRelationResponse({ result: {} }));

      const params = {
        subjectType: "user",
        subjectId: "123",
        objectType: "identity",
        objectId: "identity",
        relation: "identifier",
      };
      const result = await directory.deleteRelation(params);

      expect(directory.WriterClient.deleteRelation).toHaveBeenCalledWith(
        params
      );
      expect(result).toEqual({});

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
        "Directory service error"
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
            new GetManifestResponse({
              msg: {
                case: "metadata",
                value: {},
              },
            }),
            new GetManifestResponse({
              msg: {
                case: "body",
                value: {
                  data: new TextEncoder().encode("test"),
                },
              },
            }),
          ])
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
        "Directory service error"
      );

      getManifestMock.mockReset();
    });
  });

  describe("setManifest", () => {
    it("sets a new Manifest", async () => {
      const mockSetManifest = jest
        .spyOn(directory.ModelClient, "setManifest")
        .mockResolvedValue(new SetManifestResponse({ result: {} }));

      const result = await directory.setManifest({ body: `a:\n b` });
      expect(result).toEqual({ result: {} });

      mockSetManifest.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const mockSetManifest = jest
        .spyOn(directory.ModelClient, "setManifest")
        .mockRejectedValue(new Error("Directory service error"));

      await expect(directory.setManifest({ body: "" })).rejects.toThrow(
        "Directory service error"
      );

      mockSetManifest.mockReset();
    });
  });

  describe("deleteManifest", () => {
    it("deletes a Manifest", async () => {
      const deleteManifest = jest
        .spyOn(directory.ModelClient, "deleteManifest")
        .mockResolvedValue(new DeleteManifestResponse());

      const result = await directory.deleteManifest();
      expect(result).toEqual({});

      deleteManifest.mockReset();
    });

    it("handles errors returned by the directory service", async () => {
      const deleteManifest = jest
        .spyOn(directory.ModelClient, "deleteManifest")
        .mockRejectedValue(new Error("Directory service error"));

      await expect(directory.deleteManifest()).rejects.toThrow(
        "Directory service error"
      );

      deleteManifest.mockReset();
    });
  });
});
