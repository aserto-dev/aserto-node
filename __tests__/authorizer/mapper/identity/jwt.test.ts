import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import JWTIdentityMapper from "../../../../lib/authorizer/mapper/identity/jwt";
import identityContext from "../../../../lib/authorizer/model/identityContext";

describe("await JWTIdentityMapper", () => {
  it("throws an error if the JWT token is invalid", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer invalidToken",
      },
    });

    await expect(JWTIdentityMapper(req)).rejects.toMatch(/Invalid JWT token/);
  });

  it("throws an error if the token is missing in the authorization header", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer ",
      },
    });

    await expect(JWTIdentityMapper(req)).rejects.toMatch(/Invalid JWT token/);
  });

  it("throws an error if the authorization header is missing", async () => {
    const req = httpMocks.createRequest({});

    await expect(JWTIdentityMapper(req)).rejects.toEqual(
      "Missing authorization header"
    );
  });

  it("returns an identity context with valid JWT token", async () => {
    const jwt = nJwt.create({}, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const result = await JWTIdentityMapper(req);

    expect(result).toEqual(
      identityContext(jwt.toString(), "IDENTITY_TYPE_JWT")
    );
  });
});
