import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_instance_pb";

import { errorHandler } from "../errorHandler";
import { Authorizer } from "./index";
import JWTIdentityMapper from "./mapper/identity/jwt";
import PolicyPathMapper from "./mapper/policy/path";
import checkResourceMapper from "./mapper/resource/check";
import ResourceParamsMapper from "./mapper/resource/params";
import policyContext from "./model/policyContext";
import policyInstance from "./model/policyInstance";
import { ResourceContext } from "./model/resourceContext";

type Policy = {
  root: string;
  name?: string;
  instanceLabel?: string;
  decission?: string;
  path?: string;
};

export type CheckOptions = {
  object?: {
    id?: string;
    type?: string;
    idMapper?: StringMapper;
    mapper?: ObjectMapper;
  };
  relation?: {
    name?: string;
    mapper?: StringMapper;
  };
  subject?: {
    type?: string;
    mapper?: IdentityMapper;
  };
};

export type ResourceMapper =
  | ResourceContext
  | ((req?: Request) => Promise<ResourceContext>);

export type IdentityMapper = (req?: Request) => Promise<IdentityContext>;
export type PolicyMapper = (req?: Request) => Promise<PolicyContext>;

type ObjectMapper = (
  req?: Request
) => Promise<{ objectId: string; objectType: string }>;
type StringMapper = (req?: Request) => Promise<string>;

export class Middleware {
  client: Authorizer;
  policy: Policy;
  resourceMapper?: ResourceMapper;
  identityMapper?: IdentityMapper;
  policyMapper?: PolicyMapper;
  constructor({
    client,
    policy,
    resourceMapper,
    identityMapper,
    policyMapper,
  }: {
    client: Authorizer;
    policy: Policy;
    resourceMapper?: ResourceMapper;
    identityMapper?: IdentityMapper;
    policyMapper?: PolicyMapper;
  }) {
    this.client = client;
    this.policy = policy;
    this.resourceMapper = resourceMapper;
    this.identityMapper = identityMapper;
    this.policyMapper = policyMapper;
  }

  private policyInstance(): PolicyInstance | undefined {
    return this.policy.name && this.policy.instanceLabel
      ? policyInstance(this.policy.name, this.policy.instanceLabel)
      : undefined;
  }

  private async identityContext(req: Request): Promise<IdentityContext> {
    return this.identityMapper
      ? this.identityMapper(req)
      : JWTIdentityMapper(req);
  }

  // Check Middleware
  Check(options: CheckOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const error = errorHandler(next, true);

      const callAuthorizer = async () => {
        const policyCtx = this.policyMapper
          ? await this.policyMapper(req)
          : policyContext(`${this.policy.root}.check`, ["allowed"]);

        let resourceContext: ResourceContext = await checkResourceMapper(
          options,
          req
        );
        if (typeof this.resourceMapper === "function") {
          resourceContext = {
            ...resourceContext,
            ...(await this.resourceMapper(req)),
          };
        } else {
          resourceContext = { ...resourceContext, ...this.resourceMapper };
        }

        return this.client.Is({
          identityContext: await this.identityContext(req),
          policyContext: policyCtx,
          policyInstance: this.policyInstance(),
          resourceContext: resourceContext,
        });
      };
      try {
        const allowed = await callAuthorizer();
        return allowed
          ? next()
          : error(res, `Forbidden by policy ${this.policy.root}`);
      } catch (err) {
        error(res, err as string);
      }
    };
  }

  // Standard REST Authorization Middleware
  Is() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const error = errorHandler(next, true);

      const callAuthorizer = async () => {
        const policyCtx = this.policyMapper
          ? await this.policyMapper(req)
          : PolicyPathMapper(this.policy.root, req);

        const resourceContext = this.resourceMapper
          ? typeof this.resourceMapper === "function"
            ? await this.resourceMapper(req)
            : this.resourceMapper
          : ResourceParamsMapper(req);

        return this.client.Is({
          identityContext: await this.identityContext(req),
          policyContext: policyCtx,
          policyInstance: this.policyInstance(),
          resourceContext: resourceContext,
        });
      };
      try {
        const allowed = await callAuthorizer();
        return allowed
          ? next()
          : error(res, `Forbidden by policy ${this.policy.root}`);
      } catch (err) {
        error(res, err as string);
      }
    };
  }
}

export const ObjectIDFromVar = (key: string) => {
  return async (req: Request) => {
    return req.params?.[key];
  };
};
