import { InvalidTokenError } from "jwt-decode";
import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import JWTIdentityMapper from "../../../../lib/authorizer/mapper/identity/jwt";
import identityContext from "../../../../lib/authorizer/model/identityContext";

describe("JWTIdentityMapper", () => {
  const jwtMapper = JWTIdentityMapper();
  it("throws an error if the JWT token is invalid", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer invalidToken",
      },
    });

    await expect(jwtMapper(req)).rejects.toEqual(
      new InvalidTokenError(
        "Invalid token specified: Cannot read properties of undefined (reading 'replace')"
      )
    );
  });

  it("throws an error if the token is missing in the authorization header", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer ",
      },
    });

    await expect(jwtMapper(req)).rejects.toEqual(
      new InvalidTokenError(
        "Invalid token specified: Cannot read properties of undefined (reading 'replace')"
      )
    );
  });

  it("throws an error if the authorization header is missing", async () => {
    const req = httpMocks.createRequest({});

    await expect(jwtMapper(req)).rejects.toEqual(
      new Error("Missing Authorization header")
    );
  });

  it("returns an identity context with valid JWT token", async () => {
    const jwt = nJwt.create({}, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const result = await jwtMapper(req);

    expect(result).toEqual(identityContext(jwt.toString(), "JWT"));
  });

  it("returns an identity context with valid JWT token from a custom header", async () => {
    const jwt = nJwt.create({}, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        custom: `Bearer ${jwt}`,
      },
    });

    const customJwtMapper = JWTIdentityMapper("custom");

    const result = await customJwtMapper(req);

    expect(result).toEqual(identityContext(jwt.toString(), "JWT"));
  });

  it("throws an error if the token is missing in a custom header", async () => {
    const req = httpMocks.createRequest({
      headers: {
        custom: "Bearer ",
      },
    });

    const customJwtMapper = JWTIdentityMapper("custom");

    await expect(customJwtMapper(req)).rejects.toEqual(
      new InvalidTokenError(
        "Invalid token specified: Cannot read properties of undefined (reading 'replace')"
      )
    );
  });

  it("throws an error if the custom header is missing", async () => {
    const req = httpMocks.createRequest({});

    const customJwtMapper = JWTIdentityMapper("custom");

    await expect(customJwtMapper(req)).rejects.toEqual(
      new Error("Missing custom header")
    );
  });
});
