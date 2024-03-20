import { Request } from "express";

import { ResourceContext } from "../../model/resourceContext";

const ResourceParamsMapper = (req: Request): ResourceContext => {
  return req.params || {};
};

export default ResourceParamsMapper;
