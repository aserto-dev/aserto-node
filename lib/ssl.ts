import { readFileSync } from "fs";
import { ChannelCredentials, credentials } from "@grpc/grpc-js";

const getSSLCreds: (
  ca: string,
  key: string,
  cert: string
) => ChannelCredentials = (ca, key, cert) => {
  const root_cert = readFileSync(ca); // new
  const clientKey = readFileSync(key);
  const clientCrt = readFileSync(cert);

  const creds = credentials.createSsl(root_cert, clientKey, clientCrt); // new
  return creds;
};

export { getSSLCreds };
