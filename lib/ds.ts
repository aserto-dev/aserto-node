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
import { credentials, ServiceError } from "@grpc/grpc-js";

import { getSSLCredentials } from "./ssl";

interface ObjectParams {
  type?: string;
  id?: string;
  key?: string;
}

interface RelationParams {
  objectType?: string;
  name?: string;
  id?: number;
}

interface GetRelationParams {
  subject: ObjectParams;
  object: ObjectParams;
  relation: RelationParams;
}

const ds = (authorizerCertCAFile: string) => {
  const creds = authorizerCertCAFile
    ? getSSLCredentials(authorizerCertCAFile)
    : credentials.createInsecure();
  const client = new ReaderClient("localhost:9292", creds);

  const getObject = (params: ObjectParams) => {
    const { type, id, key } = params ?? {};
    return new Promise((resolve, reject) => {
      try {
        const getObjectRequest = new GetObjectRequest();
        const objParam = new ObjectIdentifier();
        if (!id && !type) {
          reject("You must provide either an object ID or a type");
          return;
        }
        if (key && !type) {
          reject("You must provide an object type");
          return;
        }

        type && objParam.setType(type);
        key && type && objParam.setKey(key);
        id && objParam.setId(id);

        getObjectRequest.setParam(objParam);
        client.getObject(
          getObjectRequest,
          (err: ServiceError, response: GetObjectResponse) => {
            if (err) {
              reject(err);
              return;
            } else {
              const result = response.getResult();
              const properties = result?.getProperties()?.toJavaScript();
              const resultObj = result?.toObject();
              resolve({
                ...resultObj,
                properties,
              });
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  };

  const getRelation = (params: GetRelationParams) => {
    const { subject, object, relation } = params ?? {};
    return new Promise((resolve, reject) => {
      try {
        const getRelationRequest = new GetRelationRequest();
        const {
          type: subjectType,
          id: subjectId,
          key: subjectKey,
        } = subject ?? {};

        const { type: objectType, id: objectId, key: objectKey } = object ?? {};

        if (
          (!subjectId && !subjectKey) ||
          (!subjectId && !subjectType) ||
          (subjectKey && !subjectType)
        ) {
          reject(
            "You must provide subject type and subject key or an subject id"
          );
          return;
        }

        if (
          (!objectId && !objectKey) ||
          (!objectId && !objectType) ||
          (objectKey && !objectType)
        ) {
          reject("You must provide object type and object key or an object id");
          return;
        }

        if (
          (!relation.id && !relation.name) ||
          (!relation.name && relation.objectType) ||
          (relation.name && !relation.objectType)
        ) {
          reject(
            "You must provide either a relation id or a relation name and relation object type"
          );
          return;
        }
        const relationParam = new RelationIdentifier();

        const objectParam = new ObjectIdentifier();
        objectType && objectParam.setType(objectType);
        objectKey && objectType && objectParam.setKey(objectKey);
        objectId && objectParam.setId(objectId);

        const subjectParam = new ObjectIdentifier();
        subjectType && subjectParam.setType(subjectType);
        subjectKey && subjectType && subjectParam.setKey(subjectKey);
        subjectId && subjectParam.setId(subjectId);

        const relationTypeParam = new RelationTypeIdentifier();
        relation.name &&
          relation.objectType &&
          relationTypeParam.setName(relation.name);
        relation.name &&
          relation.objectType &&
          relationTypeParam.setObjectType(relation.objectType);
        relation.id && relationTypeParam.setId(relation.id);

        relationParam.setObject(objectParam);
        relationParam.setSubject(subjectParam);
        relationParam.setRelation(relationTypeParam);
        getRelationRequest.setParam(relationParam);

        client.getRelation(
          getRelationRequest,
          (err: ServiceError, response: GetRelationResponse) => {
            if (err) {
              reject(err);
              return;
            } else {
              const result = response.toObject();
              resolve(result);
            }
          }
        );
      } catch (err) {}
    });
  };

  return {
    object: getObject,
    relation: getRelation,
  };
};

export { ds };
