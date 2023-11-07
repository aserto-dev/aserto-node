import { Request } from "express";

import { CheckOptions } from "../../middleware";
import { CheckResourceContext } from "../../model/resourceContext";

export default async (
  options: CheckOptions,
  req: Request
): Promise<Promise<CheckResourceContext>> => {
  const [objectId, objectType] = await object(options, req);
  const rel = await relation(options, req);
  return {
    object_key: objectId,
    object_type: objectType,
    relation: rel,
    subject_type: options.subject?.type || "user",
  };
};

const relation = async (
  options: CheckOptions,
  req: Request
): Promise<string> => {
  const relation = options.relation?.name;
  if (typeof relation === "function") {
    return await relation(req);
  }

  return relation || "";
};

const object = async (
  options: CheckOptions,
  req: Request
): Promise<[string, string]> => {
  const object = options.object;
  if (typeof object === "function") {
    const obj = await object(req);
    return [obj.objectId, obj.objectType];
  }

  const id = object?.id;
  if (typeof id === "function") {
    return [await id(req), object?.type || ""];
  }

  return [id || "", object?.type || ""];
};
