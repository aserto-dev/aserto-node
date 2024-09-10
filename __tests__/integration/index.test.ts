import express, { Express } from "express";
import nJwt from "njwt";
import request from "supertest";

import {
  AnonymousIdentityMapper,
  Authorizer,
  createAsyncIterable,
  DirectoryServiceV3,
  DirectoryV3,
  displayStateMap,
  EtagMismatchError,
  ImportMsgCase,
  ImportOpCode,
  NotFoundError,
  objectPropertiesAsStruct,
  policyContext,
  policyInstance,
  readAsyncIterable,
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
      await expect(directoryClient.deleteManifest({})).resolves.not.toThrow();
    });

    it("reads an empty manifest", async () => {
      const manifestData = await directoryClient.getManifest();
      expect(manifestData?.body).toEqual("");
    });

    it("sets a Manifest", async () => {
      await expect(
        directoryClient.setManifest({
          body: manifest,
        })
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
        })
      ).resolves.not.toThrow();
    });

    xit("throws EtagMismatchError when setting the same object without Etag", async () => {
      await expect(
        directoryClient.setObject({
          object: {
            type: "user",
            id: "test-user",
            displayName: "updated",
            etag: "updated",
          },
        })
      ).rejects.toThrow(EtagMismatchError);
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
        })
      ).resolves.not.toThrow();
    });

    it("gets an object", async () => {
      const user = await directoryClient.object({
        objectType: "user",
        objectId: "test-user",
      });

      expect(user?.properties?.toJson()).toEqual({ displayName: "test user" });
    });

    it("gets another object", async () => {
      const user = await directoryClient.object({
        objectType: "group",
        objectId: "test-group",
      });

      expect(user?.properties?.toJson()).toEqual({ displayName: "test group" });
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
        })
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
        })
      ).toEqual({
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

    it("checks the relation betwen an user and group(true)", async () => {
      expect(
        await directoryClient.checkRelation({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        })
      ).toEqual({ check: true, trace: [] });
    });

    it("check(relation) betwen an user and group", async () => {
      expect(
        await directoryClient.check({
          subjectId: "test-user",
          subjectType: "user",
          relation: "member",
          objectId: "test-group",
          objectType: "group",
        })
      ).toEqual({ check: true, trace: [] });
    });

    it("check(permission) betwen an user and group", async () => {
      expect(
        await directoryClient.check({
          subjectId: "test-user",
          subjectType: "user",
          relation: "read",
          objectId: "test-group",
          objectType: "group",
        })
      ).toEqual({ check: true, trace: [] });
    });

    it("checks inexistent relation throws NotFoundError", async () => {
      await expect(
        directoryClient.checkRelation({
          subjectId: "test-user",
          subjectType: "user",
          relation: "owner",
          objectId: "test-group",
          objectType: "group",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("checks inexistent permission throws NotFoundError", async () => {
      await expect(
        directoryClient.checkPermission({
          subjectId: "test-user",
          subjectType: "user",
          permission: "write",
          objectId: "test-group",
          objectType: "group",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("lists the relations of an object", async () => {
      expect(
        await directoryClient.relations({
          subjectId: "test-user",
          subjectType: "user",
        })
      ).toEqual({
        objects: {},
        page: { nextToken: "" },
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
        })
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
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("list user objects", async () => {
      expect(await directoryClient.objects({ objectType: "user" })).toEqual({
        page: { nextToken: "" },
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "test-user",
            type: "user",
            displayName: "",
          }),
        ]),
      });
    });

    it("list group objects", async () => {
      expect(await directoryClient.objects({ objectType: "group" })).toEqual({
        page: { nextToken: "" },
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
        })
      ).resolves.not.toThrow();
    });

    it("deletes an group object", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "group",
          objectId: "test-group",
        })
      ).resolves.not.toThrow();
    });

    it("throws NotFoundError when getting a deleted user object", async () => {
      await expect(
        directoryClient.object({ objectType: "user", objectId: "test-user" })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when getting a deleted group object", async () => {
      await expect(
        directoryClient.object({ objectType: "group", objectId: "test-group" })
      ).rejects.toThrow(NotFoundError);
    });

    it("returns [] when  there are no objects", async () => {
      expect(await directoryClient.objects({ objectType: "user" })).toEqual({
        results: [],
        page: { nextToken: "" },
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
              properties: objectPropertiesAsStruct({ foo: "bar" }),
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
        readAsyncIterable(await directoryClient.import(importRequest))
      ).resolves.not.toThrow();
    });

    it("exports all", async () => {
      expect(
        (
          await readAsyncIterable(
            await directoryClient.export({ options: "DATA" })
          )
        ).length
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
        await directoryClient.export({ options: "STATS_OBJECTS" })
      );
      const stats: Stats = JSON.parse(
        response?.[0]?.msg?.value?.toJsonString() || "{}"
      );
      const totals = Object.values(stats["object_types"] || {}).reduce(
        (n, { _obj_count }) => n + _obj_count,
        0
      );
      expect(totals).toEqual(2);
    });

    it("exports objects", async () => {
      expect(
        (
          await readAsyncIterable(
            await directoryClient.export({ options: "DATA_OBJECTS" })
          )
        ).length
      ).toEqual(2);
    });

    it("exports relations", async () => {
      expect(
        (
          await readAsyncIterable(
            await directoryClient.export({ options: "DATA_RELATIONS" })
          )
        ).length
      ).toEqual(1);
    });

    it("deletes an user object with relations", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "user",
          objectId: "import-user",
          withRelations: true,
        })
      ).resolves.not.toThrow();
    });

    it("deletes an group object", async () => {
      await expect(
        directoryClient.deleteObject({
          objectType: "group",
          objectId: "import-group",
          withRelations: true,
        })
      ).resolves.not.toThrow();
    });

    it("throws NotFoundError when getting a deleted user object", async () => {
      await expect(
        directoryClient.object({ objectType: "user", objectId: "import-user" })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when getting a deleted group object", async () => {
      await expect(
        directoryClient.object({
          objectType: "group",
          objectId: "import-group",
        })
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
        })
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
          }
        )
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
          }
        )
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
