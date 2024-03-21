import { InvalidTokenError } from "jwt-decode";
import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import SubIdentityMapper from "../../../../lib/authorizer/mapper/identity/sub";
import identityContext from "../../../../lib/authorizer/model/identityContext";
describe("SubIdentityMapper", () => {
  const subMapper = SubIdentityMapper();

  it("throws an error if the JWT token is invalid", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer invalidToken",
      },
    });

    await expect(subMapper(req)).rejects.toEqual(
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

    await expect(subMapper(req)).rejects.toEqual(
      new InvalidTokenError(
        "Invalid token specified: Cannot read properties of undefined (reading 'replace')"
      )
    );
  });

  it("throws an error if the authorization header is missing", async () => {
    const req = httpMocks.createRequest({});

    await expect(subMapper(req)).rejects.toEqual(
      new Error("Missing Authorization header")
    );
  });

  it("returns an identity context with valid JWT sub", async () => {
    const jwt = nJwt.create({ sub: "test" }, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const result = await subMapper(req);

    expect(result).toEqual(identityContext("test", "SUB"));
  });

  it("returns an identity context from a custom header", async () => {
    const req = httpMocks.createRequest({
      headers: {
        identity: `my-id`,
      },
    });
    const customSubMapper = SubIdentityMapper("identity");
    const result = await customSubMapper(req);

    expect(result).toEqual(identityContext("my-id", "SUB"));
  });
});
