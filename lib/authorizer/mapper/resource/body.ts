import { Request } from "express";

import { ResourceContext } from "../../model/resourceContext";

const BodyResourceMapper = (req: Request): ResourceContext => {
  return req.body;
};

export default BodyResourceMapper;
