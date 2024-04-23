import { Request } from "express";

import { ResourceContext } from "../../model/resourceContext";

const ParamsResourceMapper = (req: Request): ResourceContext => {
  return req.params;
};

export default ParamsResourceMapper;
