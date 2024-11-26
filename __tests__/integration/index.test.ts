import express, { Express } from "express";
import nJwt from "njwt";
import { describe } from "node:test";
import request from "supertest";

import {
  AnonymousIdentityMapper,
  Authorizer,
  ConfigError,
  createAsyncIterable,
  createImportRequest,
  DirectoryServiceV3,
  DirectoryV3,
  displayStateMap,
  GetObjectsResponseSchema,
  ImportMsgCase,
  ImportOpCode,
  NotFoundError,
  policyContext,
  policyInstance,
  readAsyncIterable,
  toJson,
} from "../../lib";
import { Topaz, TOPAZ_TIMEOUT } from "../topaz";

describe("Integration", () => {
  let directoryClient: DirectoryV3;
  let topaz: Topaz;

  beforeAll(async () => {
    topaz = new Topaz();
    await topaz.stop();
    await topaz.start();
    const config = {
      url: "localhost:9292",
      caFile: await topaz.caCert(),
    };

    directoryClient = DirectoryServiceV3(config);
  }, TOPAZ_TIMEOUT);

  afterAll(async () => {
    await topaz.stop();
  });

  describe("Directory Reader", () => {
    it("fallsback to reader proxy when reader is not configured", async () => {
      const readerClient = DirectoryServiceV3({
        writer: {
          url: "localhost:9292",
          caFile: await topaz.caCert(),
        },
      });

      await expect(
        readerClient.objects({ objectType: "user" }),
      ).rejects.toThrow(ConfigError);
      await expect(
        readerClient.objects({ objectType: "user" }),
      ).rejects.toThrow(
        `Cannot call 'getObjects', 'Reader' is not configured.`,
      );
    });
  });

  describe("Directory", () => {
    const manifest = `
# yaml-language-server: $schema=https://www.topaz.sh/schema/manifest.json
---
### model ###
model:
  version: 3

### object type definitions ###
types:
  ### display_name: User ###
  user:
    relations:
      ### display_name: user#manager ###
      manager: user

  ### display_name: Identity ###
  identity:
    relations:
      ### display_name: identity#identifier ###
      identifier: user

  ### display_name: Group ###
  group:
    relations:
      ### display_name: group#member ###
      member: user
    permissions:
      read: member
`;

    it("deletes a manifest", async () => {
      await expect(directoryClient.deleteManifest()).resolves.not.toThrow();
    });

    it("reads an empty manifest", async () => {
      const manifestData = await directoryClient.getManifest();
      expect(manifestData?.body).toEqual("");
    });

    it("sets a Manifest", async () => {
      await expect(
        directoryClient.setManifest({
          body: manifest,
        }),
      ).resolves.not.toThrow();
    });

    it("reads a manifest", async () => {
      const manifestData = await directoryClient.getManifest();
      expect(manifestData?.body).toEqual(manifest);
    });

    it("sets a new object", async () => {
      await expect(
        directoryClient.setObject({
          object: {
            type: "user",
            id: "test-user",
            properties: {
              displayName: "test user",
            },
          },
        }),
      ).resolves.not.toThrow();
    });

    it("sets a another object", async () => {
      await expect(
        directoryClient.setObject({
          object: {
            type: "group",
            id: "test-group",
            properties: {
              displayName: "test group",
            },
          },
        }),
      ).resolves.not.toThrow();
    });

    it("gets an object", async () => {
      const user = (
        await directoryClient.object({
          objectType: "user",
          objectId: "test-user",
        })
      )?.result;

      expect(user?.id).toEqual("test-user");
      expect(user?.properties).toEqual({ displayName: "test user" });
    });

    it("gets another object", async () => {
      const user = (
        await directoryClient.object({
          objectType: "group",
          objectId: "test-group",
        })
      )?.result;

      expect(user?.id).toEqual("test-group");
      expect(user?.properties).toEqual({ displayName: "test group" });
    });

    it("creates a relation between user and group", async () => {
      await expect(
        directoryClient.setRelation({
          relation: {
            subjectId: "test-user",
            subjectType: "user",
            relation: "member",
            objectId: "test-group",
            objectType: "group",
          },
        }),
      ).resolves.not.toThrow();
    });

    it("reads a relation between user and group(true)", async () => {
      expect(
        await directoryClient.relation({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        }),
      ).toEqual({
        $typeName: "aserto.directory.reader.v3.GetRelationResponse",
        objects: {},
        result: expect.objectContaining({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        }),
      });
    });

    it("check(relation) betwen an user and group", async () => {
      expect(
        await directoryClient.check({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        }),
      ).toMatchObject({ check: true, trace: [] });
    });

    it("check(permission) betwen an user and group", async () => {
      expect(
        await directoryClient.check({
          subjectId: "test-user",
          subjectType: "user",
          relation: "read",
          objectId: "test-group",
          objectType: "group",
        }),
      ).toMatchObject({ check: true, trace: [] });
    });

    it("lists the relations of an object", async () => {
      expect(
        await directoryClient.relations({
          subjectId: "test-user",
          subjectType: "user",
          page: {
            token: "",
          },
        }),
      ).toEqual({
        objects: {},
        page: {
          $typeName: "aserto.directory.common.v3.PaginationResponse",
          nextToken: "",
        },
        $typeName: "aserto.directory.reader.v3.GetRelationsResponse",
        results: [
          expect.objectContaining({
            subjectId: "test-user",
            subjectType: "user",
            relation: "member",
            objectId: "test-group",
            objectType: "group",
          }),
        ],
      });
    });

    it("deletes a relation between user and group", async () => {
      await expect(
        directoryClient.deleteRelation({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        }),
      ).resolves.not.toThrow();
    });

    it("throws NotFoundError when getting a delete relation", async () => {
      await expect(
        directoryClient.relation({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("list user objects", async () => {
      expect(
        await directoryClient.objects({
          objectType: "user",
          page: { token: "" },
        }),
      ).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        page: {
          $typeName: "aserto.directory.common.v3.PaginationResponse",
          nextToken: "",
        },
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "test-user",
            type: "user",
            displayName: "",
          }),
        ]),
      });
    });

    it("can serialize to json objects", async () => {
      const response = await directoryClient.objects({
        objectType: "user",
        page: { token: "" },
      });
      expect(toJson(GetObjectsResponseSchema, response!)).toEqual({
        page: {},
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "test-user",
            type: "user",
          }),
        ]),
      });
    });

    it("list group objects", async () => {
      expect(await directoryClient.objects({ objectType: "group" })).toEqual({
        page: {
          $typeName: "aserto.directory.common.v3.PaginationResponse",
          nextToken: "",
        },
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "test-group",
            type: "group",
            displayName: "",
          }),
        ]),
      });
    });

    it("deletes an user object", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "user",
          objectId: "test-user",
        }),
      ).resolves.not.toThrow();
    });

    it("deletes an group object", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "group",
          objectId: "test-group",
        }),
      ).resolves.not.toThrow();
    });

    it("throws NotFoundError when getting a deleted user object", async () => {
      await expect(
        directoryClient.object({ objectType: "user", objectId: "test-user" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when getting a deleted group object", async () => {
      await expect(
        directoryClient.object({ objectType: "group", objectId: "test-group" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("returns [] when  there are no objects", async () => {
      expect(await directoryClient.objects({ objectType: "user" })).toEqual({
        $typeName: "aserto.directory.reader.v3.GetObjectsResponse",
        results: [],
        page: {
          $typeName: "aserto.directory.common.v3.PaginationResponse",
          nextToken: "",
        },
      });
    });

    it("imports objects and relationships", async () => {
      const importRequest = createAsyncIterable([
        {
          opCode: ImportOpCode.SET,
          msg: {
            case: ImportMsgCase.OBJECT,
            value: {
              id: "import-user",
              type: "user",
              properties: { foo: "bar" },
              displayName: "name1",
            },
          },
        },
        {
          opCode: ImportOpCode.SET,
          msg: {
            case: ImportMsgCase.OBJECT,
            value: {
              id: "import-group",
              type: "group",
              properties: {},
              displayName: "name2",
            },
          },
        },
        {
          opCode: ImportOpCode.SET,
          msg: {
            case: ImportMsgCase.RELATION,
            value: {
              subjectId: "import-user",
              subjectType: "user",
              objectId: "import-group",
              objectType: "group",
              relation: "member",
            },
          },
        },
      ]);
      await expect(
        readAsyncIterable(await directoryClient.import(importRequest)),
      ).resolves.not.toThrow();
    });

    it("exports all", async () => {
      expect(
        (
          await readAsyncIterable(
            await directoryClient.export({ options: "DATA" }),
          )
        ).length,
      ).toEqual(3);
    });

    it("exports stats for objects", async () => {
      type Stats = {
        object_types: {
          [key: string]: {
            _obj_count: number;
          };
        };
      };

      const response = await readAsyncIterable(
        await directoryClient.export({ options: "STATS_OBJECTS" }),
      );
      const stats: Stats = response?.[0]?.msg?.value as Stats;

      const totals = Object.values(stats["object_types"] || {}).reduce(
        (n, { _obj_count }) => n + _obj_count,
        0,
      );
      expect(totals).toEqual(2);
    });

    it("exports objects", async () => {
      expect(
        (
          await readAsyncIterable(
            await directoryClient.export({ options: "DATA_OBJECTS" }),
          )
        ).length,
      ).toEqual(2);
      expect(
        await readAsyncIterable(
          await directoryClient.export({ options: "DATA_OBJECTS" }),
        ),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: {
              case: "object",
              value: expect.objectContaining({
                id: "import-user",
                type: "user",
                properties: { foo: "bar" },
                displayName: "name1",
              }),
            },
          }),
          expect.objectContaining({
            msg: {
              case: "object",
              value: expect.objectContaining({
                id: "import-group",
                type: "group",
                properties: {},
                displayName: "name2",
              }),
            },
          }),
        ]),
      );
    });

    it("exports relations", async () => {
      expect(
        (
          await readAsyncIterable(
            await directoryClient.export({ options: "DATA_RELATIONS" }),
          )
        ).length,
      ).toEqual(1);
      expect(
        await readAsyncIterable(
          await directoryClient.export({ options: "DATA_RELATIONS" }),
        ),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: {
              case: "relation",
              value: expect.objectContaining({
                subjectId: "import-user",
                subjectType: "user",
                objectId: "import-group",
                objectType: "group",
                relation: "member",
              }),
            },
          }),
        ]),
      );
    });

    it("deletes an user object with relations", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "user",
          objectId: "import-user",
          withRelations: true,
        }),
      ).resolves.not.toThrow();
    });

    it("deletes an group object", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "group",
          objectId: "import-group",
          withRelations: true,
        }),
      ).resolves.not.toThrow();
    });

    it("throws NotFoundError when getting a deleted user object", async () => {
      await expect(
        directoryClient.object({ objectType: "user", objectId: "import-user" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when getting a deleted group object", async () => {
      await expect(
        directoryClient.object({
          objectType: "group",
          objectId: "import-group",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when getting a delete relation", async () => {
      await expect(
        directoryClient.relation({
          subjectId: "import-user",
          subjectType: "user",
          relation: "member",
          objectId: "import-group",
          objectType: "group",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("deletes imported objects and relationships", async () => {
      const importRequest = createImportRequest([
        {
          opCode: ImportOpCode.SET,
          msg: {
            case: ImportMsgCase.OBJECT,
            value: {
              id: "import-user",
              type: "user",
              properties: { foo: "bar" },
              displayName: "name1",
            },
          },
        },
        {
          opCode: ImportOpCode.SET,
          msg: {
            case: ImportMsgCase.OBJECT,
            value: {
              id: "import-group",
              type: "group",
              properties: {},
              displayName: "name2",
            },
          },
        },
        {
          opCode: ImportOpCode.SET,
          msg: {
            case: ImportMsgCase.RELATION,
            value: {
              subjectId: "import-user",
              subjectType: "user",
              objectId: "import-group",
              objectType: "group",
              relation: "member",
            },
          },
        },
      ]);
      await expect(
        readAsyncIterable(await directoryClient.import(importRequest)),
      ).resolves.not.toThrow();
      await expect(
        directoryClient.object({
          objectType: "user",
          objectId: "import-user",
        }),
      ).resolves.not.toThrow();
      await expect(
        directoryClient.relation({
          subjectId: "import-user",
          subjectType: "user",
          relation: "member",
          objectId: "import-group",
          objectType: "group",
        }),
      ).resolves.not.toThrow();

      const deleteRequest = createImportRequest([
        {
          opCode: ImportOpCode.DELETE,
          msg: {
            case: ImportMsgCase.OBJECT,
            value: {
              id: "import-user",
              type: "user",
            },
          },
        },
        {
          opCode: ImportOpCode.DELETE,
          msg: {
            case: ImportMsgCase.RELATION,
            value: {
              subjectId: "import-user",
              subjectType: "user",
              objectId: "import-group",
              objectType: "group",
              relation: "member",
            },
          },
        },
      ]);

      await expect(
        readAsyncIterable(await directoryClient.import(deleteRequest)),
      ).resolves.not.toThrow();
      await expect(
        directoryClient.object({
          objectType: "user",
          objectId: "import-user",
        }),
      ).rejects.toThrow(NotFoundError);
      await expect(
        directoryClient.relation({
          subjectId: "import-user",
          subjectType: "user",
          relation: "member",
          objectId: "import-group",
          objectType: "group",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Authorizer", () => {
    let authorizerClient: Authorizer;

    beforeEach(async () => {
      authorizerClient = new Authorizer({
        authorizerServiceUrl: "localhost:8282",
        caFile: await topaz.caCert(),
      });
    });

    describe("DecisionTree", () => {
      it("returns the correct data structure", async () => {
        const response = await authorizerClient.DecisionTree({
          identityContext: await AnonymousIdentityMapper(),
          policyInstance: policyInstance("todo", "todo"),
          policyContext: policyContext(),
        });

        expect(response).toEqual({
          path: {
            "rebac.check": {
              allowed: false,
            },
            "todoApp.DELETE.todos.__id": { allowed: false },
            "todoApp.GET.todos": { allowed: true },
            "todoApp.GET.users.__userID": { allowed: true },
            "todoApp.POST.todos": { allowed: false },
            "todoApp.PUT.todos.__id": { allowed: false },
          },
          pathRoot: "",
        });
      });
    });
  });

  describe("DisplayStateMap", () => {
    const app: Express = express();
    const jwt = nJwt.create({ sub: "rick@the-citadel.com" }, "signingKey");

    it("returns the correct data", async () => {
      const options = {
        policyRoot: "todoApp",
        instanceName: "todo",
        authorizerServiceUrl: "localhost:8282",
        caFile: await topaz.caCert(),
        failWithError: true,
      };
      app.use(
        displayStateMap(
          options,
          undefined,
          () => {
            return AnonymousIdentityMapper();
          },
          () => {
            return new Promise((resolve) => {
              resolve(policyContext("todoApp", ["allowed"]));
            });
          },
        ),
      );

      const response = await request(app)
        .get("/__displaystatemap")
        .set("Content-type", "application/json")
        .set("Authorization", `Bearer ${jwt}`);
      expect(response.body).toEqual({
        "todoApp/DELETE/todos/__id": {
          allowed: false,
        },
        "todoApp/GET/todos": {
          allowed: true,
        },
        "todoApp/GET/users/__userID": {
          allowed: true,
        },
        "todoApp/POST/todos": {
          allowed: false,
        },
        "todoApp/PUT/todos/__id": {
          allowed: false,
        },
      });
    });
  });

  describe("DisplayStateMap Legacy `authorizerCertCAFile`", () => {
    const app: Express = express();
    const jwt = nJwt.create({ sub: "rick@the-citadel.com" }, "signingKey");

    it("returns the correct data", async () => {
      const options = {
        policyRoot: "todoApp",
        instanceName: "todo",
        authorizerServiceUrl: "localhost:8282",
        authorizerCertCAFile: await topaz.caCert(),
        failWithError: true,
      };
      app.use(
        displayStateMap(
          options,
          undefined,
          () => {
            return AnonymousIdentityMapper();
          },
          () => {
            return new Promise((resolve) => {
              resolve(policyContext("todoApp", ["allowed"]));
            });
          },
        ),
      );

      const response = await request(app)
        .get("/__displaystatemap")
        .set("Content-type", "application/json")
        .set("Authorization", `Bearer ${jwt}`);
      expect(response.body).toEqual({
        "todoApp/DELETE/todos/__id": {
          allowed: false,
        },
        "todoApp/GET/todos": {
          allowed: true,
        },
        "todoApp/GET/users/__userID": {
          allowed: true,
        },
        "todoApp/POST/todos": {
          allowed: false,
        },
        "todoApp/PUT/todos/__id": {
          allowed: false,
        },
      });
    });
  });
});
