import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import { DirectoryV3 } from "../lib";
import { log } from "../lib/log";

const DB_DIR = path.join(os.homedir(), ".config/topaz/db");
const CONFIG_DIR = path.join(os.homedir(), ".config/topaz/cfg");
const RETRY_OPTIONS = { retries: 30, retryIntervalMs: 2000 };

export class Topaz {
  directoryClient: DirectoryV3;
  constructor(directoryClient: DirectoryV3) {
    this.directoryClient = directoryClient;
  }
  async start() {
    await this.backup();
    execute(
      "topaz configure -r ghcr.io/aserto-policies/policy-todo:2.1.0 -n todo -d -s"
    );
    execute("topaz start");
    await retry(
      async () => this.directoryClient.objects({ objectType: "user" }),
      RETRY_OPTIONS
    );
  }

  async stop() {
    execute("topaz stop");
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

const execute = (command: string) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      log(`stderr: ${stderr}`);
      return;
    }
    log(`stdout: ${stdout}`);
  });
};
