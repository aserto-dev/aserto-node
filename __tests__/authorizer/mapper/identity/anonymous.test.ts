import httpMocks from "node-mocks-http";

import AnonymousIdentityMapper from "../../../../lib/authorizer/mapper/identity/anonymous";
import identityContext from "../../../../lib/authorizer/model/identityContext";
describe("AnonymousIdentityMapper", () => {
  it("returns an instance of IdentityContext with empty string value and type IDENTITY_TYPE_NONE", () => {
    const req = httpMocks.createRequest({});
    const result = AnonymousIdentityMapper(req);
    expect(result).toEqual(identityContext("", "IDENTITY_TYPE_NONE"));
  });
});
