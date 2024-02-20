import fs from "fs";
import util from "node:util";
import os from "os";
import path from "path";

import { DirectoryServiceV3 } from "../lib";
import { log } from "../lib/log";

const exec = util.promisify(require("node:child_process").exec);

const DB_DIR = path.join(os.homedir(), ".config/topaz/db");
const CONFIG_DIR = path.join(os.homedir(), ".config/topaz/cfg");
const RETRY_OPTIONS = { retries: 30, retryIntervalMs: 4000 };
export const TOPAZ_TIMEOUT =
  RETRY_OPTIONS.retries * RETRY_OPTIONS.retryIntervalMs;

export class Topaz {
  async start() {
    await this.backup();
    await execute(
      "topaz configure -r ghcr.io/aserto-policies/policy-todo:2.1.0 -n todo -d -f"
    );
    await execute("topaz start --container-version=model-v2.3");
    log("topaz start");
    await retry(
      async () =>
        fs.readFileSync(`${process.env.HOME}/.config/topaz/certs/grpc-ca.crt`),
      RETRY_OPTIONS
    );

    log("certificates are ready");

    const directoryClient = DirectoryServiceV3({
      url: "localhost:9292",
      caFile: `${process.env.HOME}/.config/topaz/certs/grpc-ca.crt`,
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

  async backup() {
    fs.rename(
      path.join(DB_DIR, "directory.db"),
      path.join(DB_DIR, "directory.bak"),
      () => {}
    );
    fs.rename(
      path.join(CONFIG_DIR, "config.yaml"),
      path.join(CONFIG_DIR, "config.bak"),
      () => {}
    );
  }

  async restore() {
    fs.rename(
      path.join(DB_DIR, "directory.bak"),
      path.join(DB_DIR, "directory.db"),
      () => {}
    );
    fs.rename(
      path.join(CONFIG_DIR, "config.bak"),
      path.join(CONFIG_DIR, "config.yaml"),
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
};
