import { Exporter } from "@aserto/node-directory/src/gen/cjs/aserto/directory/exporter/v3/exporter_pb";
import { Importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import { Model } from "@aserto/node-directory/src/gen/cjs/aserto/directory/model/v3/model_pb";
import { Reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";
import { Writer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/writer/v3/writer_pb";
import { Client } from "@connectrpc/connect";

import { ConfigError } from "../../errors";

type ConnectClient =
  | typeof Exporter
  | typeof Importer
  | typeof Model
  | typeof Reader
  | typeof Writer;

const interceptCall = (
  target: ConnectClient,
  prop: string,
  receiver: unknown,
) => {
  const fn = Reflect.get(target.methods, prop, receiver);
  if (typeof fn !== "function") {
    throw new ConfigError(
      `Cannot call '${prop}', '${target?.typeName
        ?.split(".")
        ?.slice(-1)}' is not configured.`,
    );
  }

  throw new TypeError(
    `'${prop}' is not defined on '${target?.typeName?.split(".")?.slice(-1)}'`,
  );
};

function nullProxy<T>(clientType: ConnectClient): T {
  return new Proxy<ConnectClient>(clientType, {
    get(target, prop, receiver) {
      return interceptCall(target, prop as string, receiver);
    },
  }) as T;
}

const nullReaderProxy = (): Client<typeof Reader> => {
  return nullProxy(Reader);
};

const nullWriterProxy = (): Client<typeof Writer> => {
  return nullProxy(Writer);
};

const nullImporterProxy = (): Client<typeof Importer> => {
  return nullProxy(Importer);
};

const nullExporterProxy = (): Client<typeof Exporter> => {
  return nullProxy(Exporter);
};

const nullModelProxy = (): Client<typeof Model> => {
  return nullProxy(Model);
};

export {
  nullExporterProxy,
  nullImporterProxy,
  nullModelProxy,
  nullReaderProxy,
  nullWriterProxy,
};
