import { Request } from "express";

import { CheckOptions } from "../../middleware";
import { CheckResourceContext } from "../../model/resourceContext";

export default async (
  options: CheckOptions,
  req: Request
): Promise<CheckResourceContext> => {
  const [objectId, objectType] = await object(options, req);
  const rel = await relation(options, req);
  return {
    object_id: objectId,
    object_type: objectType,
    relation: rel,
    subject_type: options.subject?.type || "user",
  };
};

const relation = async (
  options: CheckOptions,
  req: Request
): Promise<string> => {
  let name = options.relation?.name;
  if (options.relation?.mapper) {
    name = await options.relation.mapper(req);
  }

  return name || "";
};

const object = async (
  options: CheckOptions,
  req: Request
): Promise<[string, string]> => {
  let objectId = options.object?.id;
  let objectType = options.object?.type;

  if (options.object?.idMapper) {
    objectId = await options.object.idMapper(req);
  }

  if (options.object?.mapper) {
    const obj = await options.object.mapper(req);
    objectId = obj.objectId;
    objectType = obj.objectType;
  }

  return [objectId || "", objectType || ""];
};
