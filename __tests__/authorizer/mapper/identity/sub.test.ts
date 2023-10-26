import nJwt from "njwt";
import httpMocks from "node-mocks-http";

import SubIdentityMapper from "../../../../lib/authorizer/mapper/identity/sub";
import identityContext from "../../../../lib/authorizer/model/identityContext";
describe("SubIdentityMapper", () => {
  it("throws an error if the JWT token is invalid", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer invalidToken",
      },
    });

    await expect(SubIdentityMapper(req)).rejects.toMatch(/Invalid JWT token/);
  });

  it("throws an error if the token is missing in the authorization header", async () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer ",
      },
    });

    await expect(SubIdentityMapper(req)).rejects.toMatch(/Invalid JWT token/);
  });

  it("throws an error if the authorization header is missing", async () => {
    const req = httpMocks.createRequest({});

    await expect(SubIdentityMapper(req)).rejects.toEqual(
      "Missing authorization header"
    );
  });

  it("returns an identity context with valid JWT sub", async () => {
    const jwt = nJwt.create({ sub: "test" }, "signingKey");
    const req = httpMocks.createRequest({
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const result = await SubIdentityMapper(req);

    expect(result).toEqual(identityContext("test", "IDENTITY_TYPE_SUB"));
  });
});
