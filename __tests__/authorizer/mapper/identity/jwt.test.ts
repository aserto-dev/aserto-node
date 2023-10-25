import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import JWTIdentityMapper from "../../../../lib/authorizer/mapper/identity/jwt";
import identityContext from "../../../../lib/authorizer/model/identityContext";

describe("JWTIdentityMapper", () => {
  it("throws an error if the JWT token is invalid", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer invalidToken",
      },
    });

    expect(() => {
      JWTIdentityMapper(req);
    }).toThrowError("Invalid JWT token");
  });

  it("throws an error if the token is missing in the authorization header", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer ",
      },
    });

    expect(() => {
      JWTIdentityMapper(req);
    }).toThrowError("Invalid JWT token");
  });

  it("throws an error if the authorization header is missing", () => {
    const req = httpMocks.createRequest({});

    expect(() => {
      JWTIdentityMapper(req);
    }).toThrowError("Missing authorization header");
  });

  it("returns an identity context with valid JWT token", () => {
    const jwt = nJwt.create({}, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const result = JWTIdentityMapper(req);

    expect(result).toEqual(
      identityContext(jwt.toString(), "IDENTITY_TYPE_JWT")
    );
  });
});
