import httpMocks from "node-mocks-http";

import checkResourceMapper from "../../../../lib/authorizer/mapper/resource/check";
import { CheckOptions } from "../../../../lib/authorizer/middleware";

describe("checkResourceMapper", () => {
  it("returns a CheckResourceContext object with the correct properties when all options are provided", async () => {
    const options: CheckOptions = {
      object: {
        id: "objectId",
        type: "objectType",
      },
      relation: {
        name: "relationName",
      },
      subject: {
        type: "subjectType",
      },
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
      object: {
        id: "objectId",
        type: "objectType",
      },
      subject: {
        type: "subjectType",
      },
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
      relation: {
        name: "relationName",
      },
      subject: {
        type: "subjectType",
      },
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

  it("returns a CheckResourceContext object with an empty object_id and object_type when object.id is not provided", async () => {
    const options: CheckOptions = {
      object: {
        type: "objectType",
      },
      relation: {
        name: "relationName",
      },
      subject: {
        type: "subjectType",
      },
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
      object: {
        id: "objectId",
      },
      relation: {
        name: "relationName",
      },
      subject: {
        type: "subjectType",
      },
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
      object: {
        id: async () => {
          return "objectId";
        },
        type: "objectType",
      },
      relation: {
        name: async () => {
          return "relationName";
        },
      },
      subject: {
        type: "subjectType",
      },
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

      relation: {
        name: async () => {
          return "relationName";
        },
      },
      subject: {
        type: "subjectType",
      },
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
