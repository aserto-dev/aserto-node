import { Request } from "express";

import { CheckOptions } from "../../middleware";
import { CheckResourceContext } from "../../model/resourceContext";

export default async (
  options: CheckOptions,
  req: Request,
): Promise<Promise<CheckResourceContext>> => {
  const [objectId, objectType] = await object(options, req);
  const rel = await relation(options, req);
  return {
    object_id: objectId,
    object_type: objectType,
    relation: rel,
    subject_type: options.subjectType || "user",
  };
};

const relation = async (
  options: CheckOptions,
  req: Request,
): Promise<string> => {
  const relation = options.relation || "";

  return typeof relation === "function" ? await relation(req) : relation;
};

const object = async (
  options: CheckOptions,
  req: Request,
): Promise<[string, string]> => {
  const object = options.object;
  if (typeof object === "function") {
    const obj = await object(req);
    return [obj.objectId, obj.objectType];
  }

  const objectId = options.objectId || "";
  const objectType = options.objectType || "";
  return [
    typeof objectId === "function" ? await objectId(req) : objectId,
    typeof objectType === "function" ? await objectType(req) : objectType,
  ];
};
