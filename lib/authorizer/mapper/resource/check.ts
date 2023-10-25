import { Request } from "express";

import { CheckOptions } from "../../middleware";
import { CheckResourceContext } from "../../model/resourceContext";

export default (options: CheckOptions, req: Request): CheckResourceContext => {
  return {
    object_key: options.objectKey || req.params.id || "",
    relation: options.relation,
    object_type: options.objectType,
  };
};
