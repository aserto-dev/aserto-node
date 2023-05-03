import { JavaScriptValue } from "google-protobuf/google/protobuf/struct_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Reader as ReaderClient } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_connect";
import {
  GetObjectRequest,
  GetRelationRequest,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v2/reader_pb";
import {
  ConnectError,
  createPromiseClient,
  PromiseClient,
} from "@bufbuild/connect";
import { createGrpcTransport } from "@bufbuild/connect-node";

import { ServiceConfig as Config } from "./index.d";

export interface ObjectParams {
  type?: string;
  id?: string;
  key?: string;
}

export interface RelationParams {
  objectType?: string;
  name?: string;
  id?: number;
}

export interface GetRelationParams {
  subject: ObjectParams;
  object: ObjectParams;
  relation: RelationParams;
}

export interface Object {
  id: string;
  key: string;
  type: string;
  displayName: string;
  properties?: { [key: string]: JavaScriptValue };
  createdAt?: Timestamp.AsObject;
  updatedAt?: Timestamp.AsObject;
  deletedAt?: Timestamp.AsObject;
  hash: string;
}

export class Directory {
  client: PromiseClient<typeof ReaderClient>;
  headers: Headers;

  constructor(config: Config) {
    const url = config.url ?? asertoProductionDirectoryServiceUrl;

    const headers = new Headers();
    config.apiKey && headers.set("authorization", `basic ${config.apiKey}`);
    config.tenantId && headers.set("aserto-tenant-id", config.tenantId);
    this.headers = headers;
    let rejectUnauthorized = true;
    if (config.rejectUnauthorized !== undefined) {
      rejectUnauthorized = config.rejectUnauthorized;
    }

    this.client = createPromiseClient(
      ReaderClient,
      createGrpcTransport({
        httpVersion: "2",
        baseUrl: `https://${url}`,
        nodeOptions: { rejectUnauthorized: rejectUnauthorized },
      })
    );
  }

  async object(params: ObjectParams) {
    if (!params.id && !params.type) {
      throw Error("You must provide either an object ID or a type");
    }
    if (params.key && !params.type) {
      throw Error("You must provide an object type");
    }

    const getObjectRequest = new GetObjectRequest({ param: params });
    try {
      const response = await this.client.getObject(getObjectRequest, {
        headers: this.headers,
      });
      return response.result;
    } catch (err) {
      if (err instanceof ConnectError) {
        throw new Error(err.message);
      }
      throw err;
    }
  }

  async relation(params: GetRelationParams) {
    validateGetRelationParams(params);

    const getRelationRequest = new GetRelationRequest({ param: params });
    try {
      const response = await this.client.getRelation(getRelationRequest, {
        headers: this.headers,
      });
      return response.results;
    } catch (err) {
      if (err instanceof ConnectError) {
        throw new Error(err.message);
      }
      throw err;
    }
  }
}

const validateGetRelationParams = (params: GetRelationParams) => {
  validateObjectRef(params.object, "object");
  validateObjectRef(params.subject, "subject");
  validateRelationRef(params.relation);
};

const validateObjectRef = (ref: ObjectParams, side: "subject" | "object") => {
  if (ref.id) {
    return;
  }

  if (!ref.type || !ref.key) {
    throw new Error(
      `Either ${side} id or ${side} type and ${side} key must be provided`
    );
  }
};

const validateRelationRef = (ref: RelationParams) => {
  if (ref.id) {
    return;
  }

  if (!ref.objectType || !ref.name) {
    throw new Error(
      "Either relation id or relation object type and relation name must be provided"
    );
  }
};

const asertoProductionDirectoryServiceUrl = "directory.prod.aserto.com:8443";

export const ds = (config: Config): Directory => {
  return new Directory(config);
};
