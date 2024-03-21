// import { GetManifestResponse } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";

import { Exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_connect";
import { Importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_connect";
import { Model } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_connect";
import { Reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_connect";
import { Writer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_connect";

import { ConfigError } from "../../errors";

type Client =
  | typeof Reader
  | typeof Writer
  | typeof Importer
  | typeof Exporter
  | typeof Model;

const interceptCall = (target: Client, prop: string, receiver: unknown) => {
  const fn = Reflect.get(target.methods, prop, receiver);
  if (typeof fn !== "function") {
    throw new ConfigError(
      `Cannot call '${prop}', '${target?.typeName
        ?.split(".")
        ?.slice(-1)}' is not configured.`
    );
  }

  throw new TypeError(
    `'${prop}' is not defined on '${target?.typeName?.split(".")?.slice(-1)}'`
  );
};

const nullReaderProxy = new Proxy<Client>(Reader, {
  get(target, prop, receiver) {
    return interceptCall(target, prop as string, receiver);
  },
});

const nullWriterProxy = new Proxy<Client>(Writer, {
  get(target, prop, receiver) {
    return interceptCall(target, prop as string, receiver);
  },
});

const nullImporterProxy = new Proxy<Client>(Importer, {
  get(target, prop, receiver) {
    return interceptCall(target, prop as string, receiver);
  },
});

const nullExporterProxy = new Proxy<Client>(Exporter, {
  get(target, prop, receiver) {
    return interceptCall(target, prop as string, receiver);
  },
});

const nullModelProxy = new Proxy<Client>(Model, {
  get(target, prop, receiver) {
    return interceptCall(target, prop as string, receiver);
  },
});

export {
  nullReaderProxy,
  nullWriterProxy,
  nullImporterProxy,
  nullExporterProxy,
  nullModelProxy,
};
