import { JavaScriptValue } from "google-protobuf/google/protobuf/struct_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  ObjectIdentifier,
  RelationIdentifier,
  RelationTypeIdentifier,
} from "@aserto/node-directory/pkg/aserto/directory/common/v2/common_pb";
import { ReaderClient } from "@aserto/node-directory/pkg/aserto/directory/reader/v2/reader_grpc_pb";
import {
  GetObjectRequest,
  GetObjectResponse,
  GetRelationRequest,
  GetRelationResponse,
} from "@aserto/node-directory/pkg/aserto/directory/reader/v2/reader_pb";
import { credentials, Metadata, ServiceError } from "@grpc/grpc-js";

import { ServiceConfig as Config } from "./index.d";
import { getSSLCredentials } from "./ssl";

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
  client: ReaderClient;
  metadata: Metadata;

  constructor(config: Config) {
    const url = config.url ?? asertoProductionDirectoryServiceUrl;

    const creds = config.caFile
      ? getSSLCredentials(config.caFile)
      : credentials.createSsl();

    const metadata = new Metadata();
    config.apiKey && metadata.add("authorization", `basic ${config.apiKey}`);
    config.tenantId && metadata.add("aserto-tenant-id", config.tenantId);
    this.metadata = metadata;

    this.client = new ReaderClient(url, creds);
  }

  async object(params: ObjectParams) {
    if (!params.id && !params.type) {
      throw Error("You must provide either an object ID or a type");
    }
    if (params.key && !params.type) {
      throw Error("You must provide an object type");
    }

    const getObjectRequest = new GetObjectRequest();
    getObjectRequest.setParam(toObjectIdentifier(params));

    return new Promise((resolve, reject) => {
      try {
        this.client.getObject(
          getObjectRequest,
          this.metadata,
          (err: ServiceError, response: GetObjectResponse) => {
            if (err) {
              reject(err);
              return;
            }

            if (!response) {
              reject(Error("No response from directory service"));
              return;
            }

            const result = response.getResult();
            const properties = result?.getProperties()?.toJavaScript();
            const resultObj = result?.toObject();
            resolve({
              ...resultObj,
              properties,
            });
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  async relation(params: GetRelationParams) {
    validateGetRelationParams(params);

    const getRelationRequest = new GetRelationRequest();
    getRelationRequest.setParam(toRelationIdentifier(params));

    return new Promise((resolve, reject) => {
      try {
        this.client.getRelation(
          getRelationRequest,
          this.metadata,
          (err: ServiceError, response: GetRelationResponse) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response) {
              reject(Error("No response from directory service"));
              return;
            }
            resolve(response.toObject());
          }
        );
      } catch (err) {
        reject(err);
      }
    });
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

const toRelationIdentifier = (
  params: GetRelationParams
): RelationIdentifier => {
  const relationIdentifier = new RelationIdentifier();
  relationIdentifier.setObject(toObjectIdentifier(params.object));
  relationIdentifier.setSubject(toObjectIdentifier(params.subject));
  relationIdentifier.setRelation(toRelationTypeIdentifier(params.relation));
  return relationIdentifier;
};

const toObjectIdentifier = (ref: ObjectParams): ObjectIdentifier => {
  const objectParam = new ObjectIdentifier();
  ref.type && objectParam.setType(ref.type);
  ref.key && ref.type && objectParam.setKey(ref.key);
  ref.id && objectParam.setId(ref.id);
  return objectParam;
};

const toRelationTypeIdentifier = (
  ref: RelationParams
): RelationTypeIdentifier => {
  const relationTypeIdentifier = new RelationTypeIdentifier();
  ref.name && ref.objectType && relationTypeIdentifier.setName(ref.name);
  ref.name &&
    ref.objectType &&
    relationTypeIdentifier.setObjectType(ref.objectType);
  ref.id && relationTypeIdentifier.setId(ref.id);
  return relationTypeIdentifier;
};

const asertoProductionDirectoryServiceUrl = "directory.prod.aserto.com:8443";

export const ds = (config: Config): Directory => {
  return new Directory(config);
};
