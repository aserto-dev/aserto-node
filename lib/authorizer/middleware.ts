import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext } from "@aserto/node-authorizer/pkg/aserto/authorizer/v2/api/policy_context_pb";

import { errorHandler } from "../errorHandler";
import { log } from "../log";
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
  objectKey: string;
  objectType: string;
  relation: string;
};

export type ResourceMapper =
  | ResourceContext
  | ((req: Request) => Promise<ResourceContext>);

export type IdentityMapper = (req: Request) => Promise<IdentityContext>;
export type PolicyMapper = (req: Request) => Promise<PolicyContext>;

export class Middleware {
  Client: Authorizer;
  Policy: Policy;
  ResourceMapper?: ResourceMapper;
  IdentityMapper?: IdentityMapper;
  PolicyMapper?: PolicyMapper;
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
    this.Client = client;
    this.Policy = policy;
    this.ResourceMapper = resourceMapper;
    this.IdentityMapper = identityMapper;
    this.PolicyMapper = policyMapper;
  }

  // Check Middleware
  Check(options: CheckOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const error = errorHandler(next, true);

      const callAuthorizer = async () => {
        const identityCtx: IdentityContext = this.IdentityMapper
          ? await this.IdentityMapper(req)
          : JWTIdentityMapper(req);

        const policyCtx = this.PolicyMapper
          ? await this.PolicyMapper(req)
          : policyContext("rebac.check", ["allowed"]);

        let resourceContext: ResourceContext = checkResourceMapper(
          options,
          req
        );
        if (typeof this.ResourceMapper === "function") {
          resourceContext = {
            ...resourceContext,
            ...(await this.ResourceMapper(req)),
          };
        } else {
          resourceContext = { ...resourceContext, ...this.ResourceMapper };
        }

        const policyInst =
          this.Policy.name && this.Policy.instanceLabel
            ? policyInstance(this.Policy.name, this.Policy.instanceLabel)
            : undefined;

        return this.Client.Is({
          identityContext: identityCtx,
          policyContext: policyCtx,
          policyInstance: policyInst,
          resourceContext: resourceContext,
        });
      };
      try {
        const allowed = await callAuthorizer();
        log(`Requested evaluated with: ${allowed}`);
        return allowed
          ? next()
          : error(res, `Forbidden by policy ${this.Policy.root}`);
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
        const identityCtx: IdentityContext = this.IdentityMapper
          ? await this.IdentityMapper(req)
          : JWTIdentityMapper(req);

        const policyCtx = this.PolicyMapper
          ? await this.PolicyMapper(req)
          : PolicyPathMapper(this.Policy.root, req);

        const resourceContext = this.ResourceMapper
          ? typeof this.ResourceMapper === "function"
            ? await this.ResourceMapper(req)
            : this.ResourceMapper
          : ResourceParamsMapper(req);

        const policyInst =
          this.Policy.name && this.Policy.instanceLabel
            ? policyInstance(this.Policy.name, this.Policy.instanceLabel)
            : undefined;

        return this.Client.Is({
          identityContext: identityCtx,
          policyContext: policyCtx,
          policyInstance: policyInst,
          resourceContext: resourceContext,
        });
      };
      try {
        const allowed = await callAuthorizer();
        log(`Requested evaluated with: ${allowed}`);
        return allowed
          ? next()
          : error(res, `Forbidden by policy ${this.Policy.root}`);
      } catch (err) {
        error(res, err as string);
      }
    };
  }
}
