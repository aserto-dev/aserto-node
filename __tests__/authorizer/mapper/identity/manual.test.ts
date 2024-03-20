import ManualIdentityMapper from "../../../../lib/authorizer/mapper/identity/manual";
import identityContext from "../../../../lib/authorizer/model/identityContext";

describe("ManualIdentityMapper", () => {
  it("returns an instance of IdentityContext with the value and type IDENTITY_TYPE_NONE", async () => {
    const result = await ManualIdentityMapper("manual");
    expect(result).toEqual(identityContext("manual", "MANUAL"));
  });
});
