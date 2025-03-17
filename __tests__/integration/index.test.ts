import express, { Express, Request, Response } from "express";
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
  HEADER_ASERTO_MANIFEST_REQUEST,
  ImportMsgCase,
  ImportOpCode,
  MANIFEST_REQUEST_DEFAULT,
  NotFoundError,
  policyContext,
  policyInstance,
  readAsyncIterable,
  serializeAsyncIterable,
} from "../../lib";
import { Topaz, TOPAZ_TIMEOUT } from "../topaz";

describe("Integration", () => {
  let directoryClient: DirectoryV3;
  let topaz: Topaz;

  beforeAll(async () => {
    topaz = new Topaz();
    await topaz.start();
    const config = {
      url: "localhost:9292",
      caFile: await topaz.caCert(),
    };

    directoryClient = DirectoryServiceV3(config);
  }, TOPAZ_TIMEOUT);

  afterAll(async () => {
    jest.useRealTimers();
    await topaz.stop();
  });

  describe("express", () => {
    const app = express();
    app.use(express.json());

    it("check serializes to json", async () => {
      const Check = async (_req: Request, res: Response) => {
        try {
          const check = await directoryClient.check({
            subjectId: "rick@the-citadel.com",
            subjectType: "user",
            objectId: "admin",
            objectType: "group",
            relation: "member",
          });
          res.status(200).send(check);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/check", Check);

      const res = await request(app)
        .get("/check")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        check: true,
        context: {},
        trace: [],
      });
    });

    it("get object serializes to json", async () => {
      const GetObject = async (_req: Request, res: Response) => {
        try {
          const object = await directoryClient.object({
            objectId: "rick@the-citadel.com",
            objectType: "user",
          });
          res.status(200).send(object);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/object", GetObject);

      const res = await request(app)
        .get("/object")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          result: expect.objectContaining({
            id: "rick@the-citadel.com",
            properties: {
              email: "rick@the-citadel.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Rick%20Sanchez.jpg",
              roles: ["admin", "evil_genius"],
              status: "USER_STATUS_ACTIVE",
            },
          }),
        }),
      );
    });
    it("get objects serializes to json", async () => {
      const GetObjects = async (_req: Request, res: Response) => {
        try {
          const objects = await directoryClient.objects({ objectType: "user" });
          res.status(200).send(objects);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/objects", GetObjects);

      const res = await request(app)
        .get("/objects")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          results: [
            expect.objectContaining({ id: "beth@the-smiths.com" }),
            expect.objectContaining({ id: "jerry@the-smiths.com" }),
            expect.objectContaining({ id: "morty@the-citadel.com" }),
            expect.objectContaining({ id: "rick@the-citadel.com" }),
            expect.objectContaining({ id: "summer@the-smiths.com" }),
          ],
        }),
      );
    });

    it("get object many serializes to json", async () => {
      const GetObjectMany = async (_req: Request, res: Response) => {
        try {
          const objects = await directoryClient.objectMany({
            param: [
              { objectType: "user", objectId: "beth@the-smiths.com" },
              { objectType: "group", objectId: "admin" },
            ],
          });
          res.status(200).send(objects);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/objectsMany", GetObjectMany);

      const res = await request(app)
        .get("/objectsMany")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          results: [
            expect.objectContaining({ id: "beth@the-smiths.com" }),
            expect.objectContaining({ id: "admin" }),
          ],
        }),
      );
    });

    it("set object serializes to json with user string payload", async () => {
      const SetObject = async (req: Request, res: Response) => {
        try {
          const setObject = await directoryClient.setObject({
            object: req.body,
          });
          res.status(200).send(setObject);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.post("/object", SetObject);

      const res = await request(app)
        .post("/object")
        .set("Content-type", "application/json")
        .send(
          JSON.stringify({
            id: "object-1",
            type: "user",
          }),
        );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        result: expect.objectContaining({
          id: "object-1",
          type: "user",
          properties: {},
        }),
      });
    });

    it("get and object and update it serializes to json", async () => {
      const GetObject = async (_req: Request, res: Response) => {
        try {
          const object = await directoryClient.object({
            objectId: "object-1",
            objectType: "user",
          });
          res.status(200).send(object);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/object_update", GetObject);

      const SetObject = async (req: Request, res: Response) => {
        try {
          const setObject = await directoryClient.setObject({
            object: req.body,
          });
          res.status(200).send(setObject);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.post("/object_update", SetObject);

      const setObjectRes = await request(app)
        .post("/object_update")
        .set("Content-type", "application/json")
        .send(
          JSON.stringify({
            id: "object-1",
            type: "user",
          }),
        );

      expect(setObjectRes.status).toBe(200);
      expect(setObjectRes.body).toEqual({
        result: expect.objectContaining({
          id: "object-1",
          type: "user",
          properties: {},
        }),
      });

      const getObjectRes = await request(app)
        .get("/object_update")
        .set("Content-type", "application/json");

      expect(getObjectRes.status).toBe(200);
      expect(getObjectRes.body).toEqual({
        relations: [],
        result: expect.objectContaining({
          id: "object-1",
          type: "user",
          properties: {},
        }),
        page: { nextToken: "" },
      });

      const setEditObjectRes = await request(app)
        .post("/object_update")
        .set("Content-type", "application/json")
        .send(
          JSON.stringify({
            ...getObjectRes.body.result,
            displayName: "edited user",
          }),
        );
      expect(setEditObjectRes.status).toBe(200);
      expect(setEditObjectRes.body).toEqual({
        result: expect.objectContaining({
          id: "object-1",
          type: "user",
          displayName: "edited user",
          properties: {},
        }),
      });

      const getEditedObjectRes = await request(app)
        .get("/object_update")
        .set("Content-type", "application/json");

      expect(getEditedObjectRes.status).toBe(200);
      expect(getEditedObjectRes.body).toEqual({
        relations: [],
        result: expect.objectContaining({
          id: "object-1",
          type: "user",
          displayName: "edited user",
          properties: {},
        }),
        page: { nextToken: "" },
      });
    });

    it("delete object serializes to json", async () => {
      const DeleteObject = async (_req: Request, res: Response) => {
        try {
          const deleteObject = await directoryClient.deleteObject({
            objectId: "object-1",
            objectType: "user",
          });
          res.status(200).send(deleteObject);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.delete("/object", DeleteObject);

      const res = await request(app)
        .delete("/object")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: {} });
    });

    it("relation serializes to json", async () => {
      const Relation = async (_req: Request, res: Response) => {
        try {
          const relation = await directoryClient.relation({
            subjectId: "rick@the-citadel.com",
            subjectType: "user",
            objectId: "admin",
            objectType: "group",
            relation: "member",
            withObjects: true,
          });
          res.status(200).send(relation);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/relation", Relation);

      const res = await request(app)
        .get("/relation")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        result: expect.objectContaining({
          subjectId: "rick@the-citadel.com",
          subjectType: "user",
          objectId: "admin",
          objectType: "group",
          relation: "member",
        }),
        objects: {
          "group:admin": expect.objectContaining({
            id: "admin",
            displayName: "admin-group",
            type: "group",
          }),
          "user:rick@the-citadel.com": expect.objectContaining({
            id: "rick@the-citadel.com",
            displayName: "Rick Sanchez",
            type: "user",
            properties: {
              email: "rick@the-citadel.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Rick%20Sanchez.jpg",
              roles: ["admin", "evil_genius"],
              status: "USER_STATUS_ACTIVE",
            },
          }),
        },
      });
    });

    it("set relation serializes to json", async () => {
      const SetRelation = async (_req: Request, res: Response) => {
        try {
          const relation = await directoryClient.setRelation({
            relation: {
              subjectId: "beth@the-smiths.com",
              subjectType: "user",
              objectId: "admin",
              objectType: "group",
              relation: "member",
            },
          });
          res.status(200).send(relation);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.post("/relation", SetRelation);

      const res = await request(app)
        .post("/relation")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        result: expect.objectContaining({
          subjectId: "beth@the-smiths.com",
          subjectType: "user",
          objectId: "admin",
          objectType: "group",
          relation: "member",
        }),
      });
    });

    it("delete relation serializes to json", async () => {
      const DeleteRelation = async (_req: Request, res: Response) => {
        try {
          const relation = await directoryClient.deleteRelation({
            subjectId: "beth@the-smiths.com",
            subjectType: "user",
            objectId: "admin",
            objectType: "group",
            relation: "member",
          });
          res.status(200).send(relation);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.delete("/relation", DeleteRelation);

      const res = await request(app)
        .delete("/relation")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: {} });
    });

    it("relations serializes to json", async () => {
      const Relations = async (_req: Request, res: Response) => {
        try {
          const relation = await directoryClient.relations({
            subjectId: "rick@the-citadel.com",
            subjectType: "user",
            objectId: "admin",
            objectType: "group",
            relation: "member",
            withObjects: true,
          });
          res.status(200).send(relation);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/relations", Relations);

      const res = await request(app)
        .get("/relations")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: { nextToken: "" },
        results: [
          expect.objectContaining({
            subjectId: "rick@the-citadel.com",
            subjectType: "user",
            objectId: "admin",
            objectType: "group",
            relation: "member",
          }),
        ],
        objects: {
          "group:admin": expect.objectContaining({
            id: "admin",
            displayName: "admin-group",
            type: "group",
          }),
          "user:rick@the-citadel.com": expect.objectContaining({
            id: "rick@the-citadel.com",
            displayName: "Rick Sanchez",
            type: "user",
            properties: {
              email: "rick@the-citadel.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Rick%20Sanchez.jpg",
              roles: ["admin", "evil_genius"],
              status: "USER_STATUS_ACTIVE",
            },
          }),
        },
      });
    });

    it("graph serializes to json", async () => {
      const Graph = async (_req: Request, res: Response) => {
        try {
          const graph = await directoryClient.graph({
            subjectId: "rick@the-citadel.com",
            subjectType: "user",
            objectId: "admin",
            objectType: "group",
            relation: "member",
            explain: true,
            trace: true,
          });
          res.status(200).send(graph);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/graph", Graph);

      const res = await request(app)
        .get("/graph")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        results: [
          {
            objectId: "rick@the-citadel.com",
            objectType: "user",
          },
        ],
        explanation: {
          "user:rick@the-citadel.com": [
            ["group:admin#member@user:rick@the-citadel.com"],
          ],
        },
        trace: [
          "group:admin#member@user:rick@the-citadel.com = ?",
          "group:admin#member@user:rick@the-citadel.com = done",
        ],
      });
    });

    it("imports serializes to json", async () => {
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
      const Import = async (_req: Request, res: Response) => {
        try {
          const response = await directoryClient.import(importRequest);
          res.status(200).send(await serializeAsyncIterable(response));
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.post("/import", Import);

      const res = await request(app)
        .post("/import")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          counter: {
            delete: "0",
            error: "0",
            recv: "2",
            set: "2",
            type: "object",
          },
        },
        {
          counter: {
            delete: "0",
            error: "0",
            recv: "1",
            set: "1",
            type: "relation",
          },
        },
        {
          object: {
            recv: "2",
            set: "2",
            delete: "0",
            error: "0",
            type: "object",
          },
          relation: {
            recv: "1",
            set: "1",
            delete: "0",
            error: "0",
            type: "relation",
          },
        },
      ]);
    });

    it("exports serializes to json", async () => {
      const Export = async (_req: Request, res: Response) => {
        try {
          const response = await directoryClient.export({
            options: "DATA_OBJECTS",
          });
          res.status(200).send(await serializeAsyncIterable(response));
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/export", Export);

      const res = await request(app)
        .get("/export")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          object: {
            type: "group",
            id: "admin",
            displayName: "admin-group",
            properties: {},
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "group",
            id: "editor",
            displayName: "editor-group",
            properties: {},
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "group",
            id: "evil_genius",
            displayName: "evil_genius-group",
            properties: {},
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "group",
            id: "import-group",
            displayName: "name2",
            properties: {},
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "group",
            id: "viewer",
            displayName: "viewer-group",
            properties: {},
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_PID",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_PID",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_PID",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_PID",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_PID",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "beth@the-smiths.com",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_EMAIL",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "jerry@the-smiths.com",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_EMAIL",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "morty@the-citadel.com",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_EMAIL",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "rick@the-citadel.com",
            displayName: "",
            properties: {
              verified: true,
              kind: "IDENTITY_KIND_EMAIL",
              provider: "local",
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "identity",
            id: "summer@the-smiths.com",
            displayName: "",
            properties: {
              kind: "IDENTITY_KIND_EMAIL",
              provider: "local",
              verified: true,
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "resource-creator",
            id: "resource-creators",
            displayName: "Resource creators",
            properties: {},
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "user",
            id: "beth@the-smiths.com",
            displayName: "Beth Smith",
            properties: {
              email: "beth@the-smiths.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Beth%20Smith.jpg",
              roles: ["viewer"],
              status: "USER_STATUS_ACTIVE",
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "user",
            id: "import-user",
            displayName: "name1",
            properties: { foo: "bar" },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "user",
            id: "jerry@the-smiths.com",
            displayName: "Jerry Smith",
            properties: {
              email: "jerry@the-smiths.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Jerry%20Smith.jpg",
              roles: ["viewer"],
              status: "USER_STATUS_ACTIVE",
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "user",
            id: "morty@the-citadel.com",
            displayName: "Morty Smith",
            properties: {
              email: "morty@the-citadel.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Morty%20Smith.jpg",
              roles: ["editor"],
              status: "USER_STATUS_ACTIVE",
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "user",
            id: "rick@the-citadel.com",
            displayName: "Rick Sanchez",
            properties: {
              status: "USER_STATUS_ACTIVE",
              email: "rick@the-citadel.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Rick%20Sanchez.jpg",
              roles: ["admin", "evil_genius"],
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
        {
          object: {
            type: "user",
            id: "summer@the-smiths.com",
            displayName: "Summer Smith",
            properties: {
              email: "summer@the-smiths.com",
              picture:
                "https://www.topaz.sh/assets/templates/v32/citadel/img/Summer%20Smith.jpg",
              roles: ["editor"],
              status: "USER_STATUS_ACTIVE",
            },
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            etag: expect.anything(),
          },
        },
      ]);
    });

    it("get manifest serializes to json", async () => {
      const GetManifest = async (_req: Request, res: Response) => {
        try {
          const manifest = await directoryClient.getManifest(
            {},
            {
              headers: {
                [HEADER_ASERTO_MANIFEST_REQUEST]: MANIFEST_REQUEST_DEFAULT,
              },
            },
          );
          res.status(200).send(manifest);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.get("/manifest", GetManifest);

      const res = await request(app)
        .get("/manifest")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      const expectedBody = `# yaml-language-server: $schema=https://www.topaz.sh/schema/manifest.json
---

# model
model:
  version: 3

# object type definitions
types:
  ### display_name: User ###
  # user represents a user that can be granted role(s)
  user:
    relations:
      manager: user

    permissions:
      ### display_name: user#in_management_chain ###
      in_management_chain: manager | manager->in_management_chain

  ### display_name: Group ###
  # group represents a collection of users and/or (nested) groups
  group:
    relations:
      member: user | group#member

  ### display_name: Identity ###
  # identity represents a collection of identities for users
  identity:
    relations:
      identifier: user

  ### display_name: Resource Creator ###
  # resource creator represents a user type that can create new resources
  resource-creator:
    relations:
      member: user | group#member

    permissions:
      can_create_resource: member


  # resource represents a protected resource
  resource:
    relations:
      owner: user
      writer: user | group#member
      reader: user | group#member

    permissions:
      can_read: reader | writer | owner
      can_write: writer | owner
      can_delete: owner
`;

      expect(res.body).toEqual({
        body: expectedBody,
        model: {},
        updatedAt: expect.any(String),
        etag: expect.any(String),
      });
    });

    it("deletes manifest serializes to json", async () => {
      const DeleteManifest = async (_req: Request, res: Response) => {
        try {
          const response = await directoryClient.deleteManifest();
          res.status(200).send(response);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.delete("/manifest", DeleteManifest);

      const res = await request(app)
        .delete("/manifest")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: {} });
    });

    it("set manifest serializes to json", async () => {
      const SetManifest = async (_req: Request, res: Response) => {
        try {
          const response = await directoryClient.setManifest({ body: "---" });
          res.status(200).send(response);
        } catch (error) {
          console.error(error);
          res.status(500).send(error);
        }
      };
      app.post("/manifest", SetManifest);

      const res = await request(app)
        .post("/manifest")
        .set("Content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: {} });
    });
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
      expect(manifestData.body).toEqual(manifest);
    });

    it("sets a new object", async () => {
      await expect(
        directoryClient.setObject({
          object: {
            type: "user",
            id: "test-user",
            displayName: "test user",
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
      ).result;

      expect(user?.id).toEqual("test-user");
      expect(user?.properties).toEqual({ displayName: "test user" });
    });

    it("updates an object", async () => {
      const user = (
        await directoryClient.object({
          objectType: "user",
          objectId: "test-user",
        })
      ).result;

      user!.displayName = "edited test user";
      await directoryClient.setObject({
        object: user,
      });

      const updatedUser = (
        await directoryClient.object({
          objectType: "user",
          objectId: "test-user",
        })
      ).result;

      expect(updatedUser?.id).toEqual("test-user");
      expect(updatedUser?.displayName).toEqual("edited test user");

      updatedUser!.displayName = "test user";
      await directoryClient.setObject({
        object: updatedUser,
      });
    });

    it("gets another object", async () => {
      const user = (
        await directoryClient.object({
          objectType: "group",
          objectId: "test-group",
        })
      ).result;

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
      ).toMatchObject({ check: true });
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
      ).toMatchObject({ check: true });
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
        page: { nextToken: "" },
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "test-user",
            type: "user",
            displayName: "test user",
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
        page: { nextToken: "" },
        results: [],
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
        await serializeAsyncIterable(
          await directoryClient.export({ options: "DATA_OBJECTS" }),
        ),
      ).toEqual([
        {
          object: expect.objectContaining({
            displayName: "name2",
            id: "import-group",
            properties: {},
            type: "group",
          }),
        },
        {
          object: expect.objectContaining({
            displayName: "name1",
            id: "import-user",
            properties: { foo: "bar" },
            type: "user",
          }),
        },
      ]);
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
        await serializeAsyncIterable(
          await directoryClient.export({ options: "DATA_RELATIONS" }),
        ),
      ).toEqual([
        {
          relation: expect.objectContaining({
            objectId: "import-group",
            objectType: "group",
            relation: "member",
            subjectId: "import-user",
            subjectType: "user",
          }),
        },
      ]);
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

        const expectedResult = {
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
        };

        expect(response).toEqual(expectedResult);
        expect(JSON.parse(JSON.stringify(response))).toEqual(expectedResult);
      });
    });

    describe("Is", () => {
      it("returns the correct data structure", async () => {
        const response = await authorizerClient.Is({
          identityContext: await AnonymousIdentityMapper(),
          policyInstance: policyInstance("todo", "todo"),
          policyContext: policyContext("todoApp.GET.todos"),
        });

        const expectedResult = true;

        expect(response).toEqual(expectedResult);
        expect(JSON.parse(JSON.stringify(response))).toEqual(expectedResult);
      });
    });

    describe("Query", () => {
      it("returns the correct data structure", async () => {
        const response = await authorizerClient.Query({
          query: "x=data",
          input: '{"foo": "bar"}',
        });

        const expectedResult = {
          result: [
            {
              bindings: {
                x: {
                  rebac: { check: { allowed: false } },
                  todoApp: {
                    DELETE: { todos: { __id: { allowed: false } } },
                    GET: {
                      todos: { allowed: true },
                      users: { __userID: { allowed: true } },
                    },
                    POST: { todos: { allowed: false } },
                    PUT: { todos: { __id: { allowed: false } } },
                    common: {},
                  },
                },
              },
              expressions: [
                { location: { col: 1, row: 1 }, text: "x=data", value: true },
              ],
            },
          ],
        };

        expect(response).toEqual(expectedResult);
        expect(JSON.parse(JSON.stringify(response))).toEqual(expectedResult);
      });
    });

    describe("ListPolicies", () => {
      it("returns the correct data structure", async () => {
        const response = await authorizerClient.ListPolicies({
          policyInstance: {
            name: "todo",
          },
          fieldMask: {
            paths: ["id"],
          },
        });

        const expectedResult = [
          {
            id: "todo/github/workspace/content/src/policies/todoApp.DELETE.todos.__id.rego",
          },
          {
            id: "todo/github/workspace/content/src/policies/todoApp.GET.todos.rego",
          },
          {
            id: "todo/github/workspace/content/src/policies/todoApp.GET.users.__userID.rego",
          },
          {
            id: "todo/github/workspace/content/src/policies/todoApp.POST.todos.rego",
          },
          {
            id: "todo/github/workspace/content/src/policies/todoApp.PUT.todos.__id.rego",
          },
          {
            id: "todo/github/workspace/content/src/policies/todoApp.common.rego",
          },
          { id: "todo/github/workspace/content/src/policies/rebac.check.rego" },
        ];

        expect(response).toEqual(expect.arrayContaining(expectedResult));
        expect(JSON.parse(JSON.stringify(response))).toEqual(
          expect.arrayContaining(expectedResult),
        );
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
