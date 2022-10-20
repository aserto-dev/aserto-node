"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ds = void 0;
const common_pb_1 = require("@aserto/node-directory/pkg/aserto/directory/common/v2/common_pb");
const reader_grpc_pb_1 = require("@aserto/node-directory/pkg/aserto/directory/reader/v2/reader_grpc_pb");
const reader_pb_1 = require("@aserto/node-directory/pkg/aserto/directory/reader/v2/reader_pb");
const grpc_js_1 = require("@grpc/grpc-js");
const ssl_1 = require("./ssl");
const ds = (authorizerCertCAFile) => {
    const creds = authorizerCertCAFile
        ? (0, ssl_1.getSSLCredentials)(authorizerCertCAFile)
        : grpc_js_1.credentials.createInsecure();
    const client = new reader_grpc_pb_1.ReaderClient("localhost:9292", creds);
    const getObject = (params) => {
        const { type, id, key } = params !== null && params !== void 0 ? params : {};
        return new Promise((resolve, reject) => {
            try {
                const getObjectRequest = new reader_pb_1.GetObjectRequest();
                const objParam = new common_pb_1.ObjectIdentifier();
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
                client.getObject(getObjectRequest, (err, response) => {
                    var _a;
                    if (err) {
                        reject(err);
                        return;
                    }
                    else {
                        const result = response.getResult();
                        const properties = (_a = result === null || result === void 0 ? void 0 : result.getProperties()) === null || _a === void 0 ? void 0 : _a.toJavaScript();
                        const resultObj = result === null || result === void 0 ? void 0 : result.toObject();
                        resolve(Object.assign(Object.assign({}, resultObj), { properties }));
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    };
    const getRelation = (params) => {
        const { subject, object, relation } = params !== null && params !== void 0 ? params : {};
        return new Promise((resolve, reject) => {
            try {
                const getRelationRequest = new reader_pb_1.GetRelationRequest();
                const { type: subjectType, id: subjectId, key: subjectKey, } = subject !== null && subject !== void 0 ? subject : {};
                const { type: objectType, id: objectId, key: objectKey } = object !== null && object !== void 0 ? object : {};
                if ((!subjectId && !subjectKey) ||
                    (!subjectId && !subjectType) ||
                    (subjectKey && !subjectType)) {
                    reject("You must provide subject type and subject key or an subject id");
                    return;
                }
                if ((!objectId && !objectKey) ||
                    (!objectId && !objectType) ||
                    (objectKey && !objectType)) {
                    reject("You must provide object type and object key or an object id");
                    return;
                }
                if ((!relation.id && !relation.name) ||
                    (!relation.name && relation.objectType) ||
                    (relation.name && !relation.objectType)) {
                    reject("You must provide either a relation id or a relation name and relation object type");
                    return;
                }
                const relationParam = new common_pb_1.RelationIdentifier();
                const objectParam = new common_pb_1.ObjectIdentifier();
                objectType && objectParam.setType(objectType);
                objectKey && objectType && objectParam.setKey(objectKey);
                objectId && objectParam.setId(objectId);
                const subjectParam = new common_pb_1.ObjectIdentifier();
                subjectType && subjectParam.setType(subjectType);
                subjectKey && subjectType && subjectParam.setKey(subjectKey);
                subjectId && subjectParam.setId(subjectId);
                const relationTypeParam = new common_pb_1.RelationTypeIdentifier();
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
                client.getRelation(getRelationRequest, (err, response) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    else {
                        const result = response.toObject();
                        resolve(result);
                    }
                });
            }
            catch (err) { }
        });
    };
    return {
        object: getObject,
        relation: getRelation,
    };
};
exports.ds = ds;
//# sourceMappingURL=ds.js.map