import { Directory, ds } from "../lib/ds";
describe("ds", () => {
  it("creates a new instance of Directory with valid config", () => {
    const config = {
      url: "directory.prod.aserto.com:8443",
      tenantId: "tenantId",
      apiKey: "apiKey",
      reader: {
        url: "readerUrl",
        apiKey: "readerApiKey",
        tenantId: "readerTenantId",
      },
      writer: {
        url: "writerUrl",
        apiKey: "writerApiKey",
        tenantId: "writerTenantId",
      },
      importer: {
        url: "importerUrl",
        apiKey: "importerApiKey",
        tenantId: "importerTenantId",
      },
      exporter: {
        url: "exporterUrl",
        apiKey: "exporterApiKey",
        tenantId: "exporterTenantId",
      },
      rejectUnauthorized: true,
    };

    const directory = ds(config);

    expect(directory).toBeInstanceOf(Directory);
  });
});
