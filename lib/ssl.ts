import { readFileSync } from "fs";
import { ChannelCredentials, credentials } from "@grpc/grpc-js";

const getSSLCredentials: (ca: string | undefined) => ChannelCredentials = (
  ca
) => {
  if (!!ca) {
    const root_cert = readFileSync(ca);
    return credentials.createSsl(root_cert);
  }

  return credentials.createSsl();
};

export default getSSLCredentials;
