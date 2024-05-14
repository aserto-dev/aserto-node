import fs from "fs";
import util from "node:util";
import path from "path";

import { DirectoryServiceV3 } from "../lib";
import { log } from "../lib/log";

const exec = util.promisify(require("node:child_process").exec);
const RETRY_OPTIONS = { retries: 30, retryIntervalMs: 4000 };
export const TOPAZ_TIMEOUT =
  RETRY_OPTIONS.retries * RETRY_OPTIONS.retryIntervalMs;

export class Topaz {
  async start() {
    await this.backup();
    await execute(
      "topaz config new -r ghcr.io/aserto-policies/policy-todo:2.1.0 -n todo -d -f"
    );

    await execute("topaz config use todo");

    const certsDir = await this.caCert();

    await retry(async () => fs.readFileSync(certsDir), RETRY_OPTIONS);
    log("certificates are ready");

    await execute("topaz config info");

    await execute("topaz start");
    log(`topaz start with ${certsDir}`);

    const directoryClient = DirectoryServiceV3({
      url: "localhost:9292",
      caFile: certsDir,
    });
    await retry(
      async () => directoryClient.objects({ objectType: "user" }),
      RETRY_OPTIONS
    );
  }

  async stop() {
    await execute("topaz stop");
    await this.restore();
  }

  async caCert() {
    return `${(
      await execute("topaz config info | jq -r '.config.topaz_certs_dir'")
    ).replace(/(\r\n|\n|\r)/gm, "")}/grpc-ca.crt`;
  }

  async dbDir() {
    return `${(
      await execute("topaz config info | jq -r '.config.topaz_db_dir'")
    ).replace(/(\r\n|\n|\r)/gm, "")}`;
  }

  async configDir() {
    return `${(
      await execute("topaz config info | jq -r '.config.topaz_cfg_dir'")
    ).replace(/(\r\n|\n|\r)/gm, "")}`;
  }

  async backup() {
    fs.rename(
      path.join(await this.dbDir(), "directory.db"),
      path.join(await this.dbDir(), "directory.bak"),
      () => {}
    );
    fs.rename(
      path.join(await this.configDir(), "todo.yaml"),
      path.join(await this.configDir(), "todo.bak"),
      () => {}
    );
  }

  async restore() {
    fs.rename(
      path.join(await this.dbDir(), "directory.bak"),
      path.join(await this.dbDir(), "directory.db"),
      () => {}
    );
    fs.rename(
      path.join(await this.configDir(), "todo.bak"),
      path.join(await this.configDir(), "todo.yaml"),
      () => {}
    );
  }
}

const retry = async <T>(
  fn: () => Promise<T> | T,
  { retries, retryIntervalMs }: { retries: number; retryIntervalMs: number }
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    log((error as Error).message);
    if (retries <= 0) {
      throw error;
    }
    log(`Retrying...`);
    await sleep(retryIntervalMs);
    return retry(fn, { retries: retries - 1, retryIntervalMs });
  }
};
const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const execute = async (command: string) => {
  const { error, stdout, stderr } = await exec(command);
  if (error) {
    log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    log(`stderr: ${stderr}`);
    return;
  }
  log(`stdout: ${stdout}`);
  return stdout;
};
