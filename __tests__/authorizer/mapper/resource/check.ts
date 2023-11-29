import httpMocks from "node-mocks-http";

import checkResourceMapper from "../../../../lib/authorizer/mapper/resource/check";
import { CheckOptions } from "../../../../lib/authorizer/middleware";

describe("checkResourceMapper", () => {
  it("returns a CheckResourceContext object with the correct properties when all options are provided", async () => {
    const options: CheckOptions = {
      objectId: "objectId",
      objectType: "objectType",
      relation: "relationName",
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "objectId",
      object_type: "objectType",
      relation: "relationName",
      subject_type: "subjectType",
    });
  });

  it("returns a CheckResourceContext object with the correct checkResourceMapper subject_type when subject is not provided", async () => {
    const options: CheckOptions = {};

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "",
      object_type: "",
      relation: "",
      subject_type: "user",
    });
  });

  it("returns a CheckResourceContext object with an empty relation when relation is not provided", async () => {
    const options: CheckOptions = {
      objectId: "objectId",
      objectType: "objectType",
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "objectId",
      object_type: "objectType",
      relation: "",
      subject_type: "subjectType",
    });
  });

  it("returns a CheckResourceContext object with an empty object_id and object_type when object is not provided", async () => {
    const options: CheckOptions = {
      relation: "relationName",
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "",
      object_type: "",
      relation: "relationName",
      subject_type: "subjectType",
    });
  });

  it("returns a CheckResourceContext object with an empty object_id when object.id is not provided", async () => {
    const options: CheckOptions = {
      objectType: "objectType",
      relation: "relationName",
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "",
      object_type: "objectType",
      relation: "relationName",
      subject_type: "subjectType",
    });
  });

  it("returns a CheckResourceContext object with an empty object_type when object.type is not provided", async () => {
    const options: CheckOptions = {
      objectId: "objectId",
      relation: "relationName",
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "objectId",
      object_type: "",
      relation: "relationName",
      subject_type: "subjectType",
    });
  });

  it("returns a CheckResourceContext object with the correct properties when all options are functions", async () => {
    const options: CheckOptions = {
      objectId: async () => {
        return "objectId";
      },
      objectType: "objectType",
      relation: async () => {
        return "relationName";
      },
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "objectId",
      object_type: "objectType",
      relation: "relationName",
      subject_type: "subjectType",
    });
  });

  it("returns a CheckResourceContext object with the correct properties when object is a function", async () => {
    const options: CheckOptions = {
      object: async () => {
        return {
          objectId: "objectId",
          objectType: "objectType",
        };
      },
      relation: async () => {
        return "relationName";
      },
      subjectType: "subjectType",
    };

    const req = httpMocks.createRequest({});

    const result = await checkResourceMapper(options, req);

    expect(result).toEqual({
      object_id: "objectId",
      object_type: "objectType",
      relation: "relationName",
      subject_type: "subjectType",
    });
  });
});
