import AnonymousIdentityMapper from "../../../../lib/authorizer/mapper/identity/anonymous";
import identityContext from "../../../../lib/authorizer/model/identityContext";

describe("AnonymousIdentityMapper", () => {
  it("returns an instance of IdentityContext with empty string value and type IDENTITY_TYPE_NONE", async () => {
    const result = await AnonymousIdentityMapper();
    expect(result).toEqual(identityContext("", "IDENTITY_TYPE_NONE"));
  });
});
