import { readFileSync } from "fs";
import { ChannelCredentials, credentials } from "@grpc/grpc-js";

const getSSLCredentials: (ca: string) => ChannelCredentials = (ca) => {
  const root_cert = readFileSync(ca); // new
  return credentials.createSsl(root_cert); // new
};

export { getSSLCredentials };
