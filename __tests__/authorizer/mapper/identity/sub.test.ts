import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import SubIdentityMapper from "../../../../lib/authorizer/mapper/identity/sub";
import identityContext from "../../../../lib/authorizer/model/identityContext";
describe("SubIdentityMapper", () => {
  it("throws an error if the JWT token is invalid", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer invalidToken",
      },
    });

    expect(() => {
      SubIdentityMapper(req);
    }).toThrowError("Invalid JWT token");
  });

  it("throws an error if the token is missing in the authorization header", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer ",
      },
    });

    expect(() => {
      SubIdentityMapper(req);
    }).toThrowError("Invalid JWT token");
  });

  it("throws an error if the authorization header is missing", () => {
    const req = httpMocks.createRequest({});

    expect(() => {
      SubIdentityMapper(req);
    }).toThrowError("Missing authorization header");
  });

  it("returns an identity context with valid JWT sub", () => {
    const jwt = nJwt.create({ sub: "test" }, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const result = SubIdentityMapper(req);

    expect(result).toEqual(identityContext("test", "IDENTITY_TYPE_SUB"));
  });
});
