import { NextFunction, Request, Response } from "express";
import { IdentityContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/identity_context_pb";
import { PolicyContext } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_context_pb";
import { PolicyInstance } from "@aserto/node-authorizer/src/gen/cjs/aserto/authorizer/v2/api/policy_instance_pb";
import { CallOptions } from "@connectrpc/connect";

import { errorHandler } from "../errorHandler";
import { Authorizer } from ".";
import JWTIdentityMapper from "./mapper/identity/jwt";
import PolicyPathMapper from "./mapper/policy/path";
import checkResourceMapper from "./mapper/resource/check";
import ParamsResourceMapper from "./mapper/resource/params";
import policyContext from "./model/policyContext";
import policyInstance from "./model/policyInstance";
import { ResourceContext } from "./model/resourceContext";

type Policy = {
  root: string;
  name?: string;
  instanceLabel?: string;
  decision?: string;
  path?: string;
};

export type CheckOptions = {
  object?: ObjectMapper;
  objectId?: string | StringMapper;
  objectType?: string | StringMapper;
  relation?: string | StringMapper;
  subjectType?: string;
};

export type ResourceMapper =
  | ResourceContext
  | ((req?: Request) => Promise<ResourceContext>);

export type IdentityMapper = (req: Request) => Promise<IdentityContext>;
export type PolicyMapper = (req?: Request) => Promise<PolicyContext>;

type ObjectMapper = (
  req?: Request
) => Promise<{ objectId: string; objectType: string }>;
type StringMapper = (req?: Request) => Promise<string>;

export class Middleware {
  client: Authorizer;
  policy: Policy;
  failWithError: boolean;
  resourceMapper?: ResourceMapper;
  identityMapper?: IdentityMapper;
  policyMapper?: PolicyMapper;
  callOptions?: CallOptions;
  constructor({
    client,
    policy,
    resourceMapper,
    identityMapper,
    policyMapper,
    failWithError,
    callOptions,
  }: {
    client: Authorizer;
    policy: Policy;
    resourceMapper?: ResourceMapper;
    identityMapper?: IdentityMapper;
    policyMapper?: PolicyMapper;
    failWithError?: boolean;
    callOptions?: CallOptions;
  }) {
    this.client = client;
    this.policy = policy;
    this.resourceMapper = resourceMapper;
    this.identityMapper = identityMapper;
    this.policyMapper = policyMapper;
    this.failWithError = failWithError || false;
    this.callOptions = callOptions;
  }

  private policyInstance(): PolicyInstance | undefined {
    return this.policy.name ? policyInstance(this.policy.name) : undefined;
  }

  private async identityContext(req: Request): Promise<IdentityContext> {
    const idMapper = this.identityMapper || JWTIdentityMapper();
    if (typeof idMapper === "function") {
      return idMapper(req);
    }
    return idMapper;
  }

  // Check Middleware
  Check(options: CheckOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const error = errorHandler(next, this.failWithError);

      const callAuthorizer = async () => {
        const policyCtx = this.policyMapper
          ? await this.policyMapper(req)
          : policyContext(`${this.policy.root}.check`, [
              this.policy.decision || "allowed",
            ]);

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

        return [
          await this.client.Is(
            {
              identityContext: await this.identityContext(req),
              policyContext: policyCtx,
              policyInstance: this.policyInstance(),
              resourceContext: resourceContext,
            },
            this.callOptions
          ),
          policyCtx.path,
        ];
      };
      try {
        const [allowed, policyPath] = await callAuthorizer();
        return allowed
          ? next()
          : error(res, `Forbidden by policy ${policyPath}`);
      } catch (err) {
        error(res, err as string);
      }
    };
  }

  // Standard REST Authorization Middleware
  Authz() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const error = errorHandler(next, this.failWithError);

      const callAuthorizer = async () => {
        const policyCtx = this.policyMapper
          ? await this.policyMapper(req)
          : PolicyPathMapper(this.policy.root, req);

        const resourceContext = this.resourceMapper
          ? typeof this.resourceMapper === "function"
            ? await this.resourceMapper(req)
            : this.resourceMapper
          : ParamsResourceMapper(req);

        return [
          await this.client.Is({
            identityContext: await this.identityContext(req),
            policyContext: policyCtx,
            policyInstance: this.policyInstance(),
            resourceContext: resourceContext,
          }),
          policyCtx.path,
          this.callOptions,
        ];
      };
      try {
        const [allowed, policyPath] = await callAuthorizer();
        return allowed
          ? next()
          : error(res, `Forbidden by policy ${policyPath}`);
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
