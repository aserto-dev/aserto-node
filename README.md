# aserto-node
[![npm version](https://badge.fury.io/js/@aserto%2Faserto-node.svg)](https://badge.fury.io/js/@aserto%2Faserto-node)
[![codecov](https://codecov.io/github/aserto-dev/aserto-node/graph/badge.svg?token=xMt1L6Hd2D)](https://codecov.io/github/aserto-dev/aserto-node)
[![Tests](https://github.com/aserto-dev/aserto-node/actions/workflows/tests.yaml/badge.svg?branch=main)](https://github.com/aserto-dev/aserto-node/actions/workflows/tests.yaml)
[<img src="https://img.shields.io/badge/slack-@asertocommunity-yellow.svg?logo=slack">](https://www.aserto.com/slack)

Aserto authorization middleware for the node Express server, based on
Auth0's [express-jwt-authz](https://github.com/auth0/express-jwt-authz)
package.

This package provides multiple capabilities:

1. `Middleware` - Provides 2 implementations: `Authz` and `Check` middlewares that sits on a route, and validates a request to authorize access to that route.
2. `Authorizer` - Authorizer Client that provides functions to facilitate communication with an Authorizer v2 service.
3. `DirectoryServiceV3` - Directory Client that provides functions to facilitate communication with an Directory v3 service.
4. `DirectoryServiceV2` - Directory Client that provides functions to facilitate communication with an Directory v2 service.
5. `jwtAuthz`(deprecated): middleware that sits on a route, and validates a request to authorize access to that route.
6. `displayStateMap`: middleware that adds an endpoint for returning the display state map for a service, based on its authorization policy.
7. `is`: a function that can be called to make a decision about a user's access to a resource based on a policy.
8. `ds`(deprecated): an object containing the `object` and `relation` functions, which can be called to retrieve an object or relation, respectively, from the directory.

## Installation

Using [npm](https://npmjs.org):

```sh
npm install @aserto/aserto-node
```

Using [yarn](https://yarnpkg.com):

```sh
yarn add @aserto/aserto-node
```

> `express@^4.0.0` is a peer dependency. Make sure it is installed in your project.

## Authorizer

### Authorizer Client
```ts
interface Authorizer {
  config: AuthorizerConfig,
  channelCredentials: ChannelCredentials = credentials.createSsl()
};

type AuthorizerConfig = {
  authorizerServiceUrl?: string;
  tenantId?: string;
  authorizerApiKey?: string;
  authorizerCertFile?: string;
};
```
```ts
const authClient = new Authorizer({
  authorizerServiceUrl: "authorizer.eng.aserto.com:8443",
  authorizerApiKey: "my-authorizer-api-key",
  tenantId: "my-tenant-id",
}, credentials.createSsl());
```

- `authorizerServiceUrl`: hostname:port of authorizer service (_required_)
- `authorizerApiKey`: API key for authorizer service (_required_ if using hosted authorizer)
- `tenantId`: Aserto tenant ID (_required_ if using hosted authorizer)
- `channelCredentials`: [gRPC channelCredentials](https://github.com/grpc/grpc-node/blob/master/packages/grpc-js/src/channel-credentials.ts)

### Topaz
```ts
import { getSSLCredentials } from "@aserto/aserto-node";

const sslCredentials = getSSLCredentials(`${process.env.HOME}/.config/topaz/certs/grpc-ca.crt`)

const authClient = new Authorizer({
  authorizerServiceUrl: "localhost:8282",
}, sslCredentials);
```

#### Example:
```ts
import {
  Authorizer,
  getSSLCredentials,
  identityContext,
  policyContext,
  policyInstance,
} from "@aserto/aserto-node";

const authClient = new Authorizer(
  {
    authorizerServiceUrl: "localhost:8282",
  },
  getSSLCredentials(`${process.env.HOME}/.config/topaz/certs/grpc-ca.crt`)
);

authClient
  .Is({
    identityContext: identityContext(
      "rick@the-citadel.com",
      "IDENTITY_TYPE_SUB"
    ),
    policyInstance: policyInstance("rebac", "rebac"),
    policyContext: policyContext("rebac.check", ["allowed"]),
    resourceContext: {
      object_type: "group",
      object_id: "evil_genius",
      relation: "member",
    },
  })
```

### Methods
```ts
// Is
await authClient
  .Is({
    identityContext: identityContext(
      "morty@the-citadel.com",
      "IDENTITY_TYPE_SUB"
    ),
    policyInstance: policyInstance("todo", "todo"),
    policyContext: policyContext("todoApp.POST.todos", ["allowed"]),
    resourceContext: {
      ownerID: "fd1614d3-c39a-4781-b7bd-8b96f5a5100d",
    },
  })

// Query
await authClient
  .Is({
    identityContext: identityContext(
      "morty@the-citadel.com",
      "IDENTITY_TYPE_SUB"
    ),
    policyInstance: policyInstance("todo", "todo"),
    policyContext: policyContext("todoApp.POST.todos", ["allowed"]),
    resourceContext: {
      ownerID: "fd1614d3-c39a-4781-b7bd-8b96f5a5100d",
    },
    query: "x = data",
  })


// DecisionTree
await authClient
  .DecisionTree({
    identityContext: identityContext(
      "morty@the-citadel.com",
      "IDENTITY_TYPE_SUB"
    ),
    policyInstance: policyInstance("todo", "todo"),
    policyContext: policyContext("todoApp.POST.todos", ["allowed"]),
    resourceContext: {
      ownerID: "fd1614d3-c39a-4781-b7bd-8b96f5a5100d",
    },
  })


// ListPolicies
await authClient
  .ListPolicies({ policyInstance: policyInstance("todo", "todo") })
```

### Middleware

When authorization middleware is configured and attached to a server, it examines incoming requests, extracts authorization parameters like the caller's identity, calls the Aserto authorizers, and rejects messages if their access is denied.

`failWithError`: When set to `true`, will forward errors to `next` instead of ending the response directly.

```ts
interface Middleware {
  client: Authorizer;
  policy: Policy;
  resourceMapper?: ResourceMapper;
  identityMapper?: IdentityMapper;
  policyMapper?: PolicyMapper;
  failWithError?: boolean;
}

type Policy = {
  root: string;
  name?: string;
  instanceLabel?: string;
  decision?: string;
  path?: string;
};

type CheckOptions = {
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

type ResourceMapper =
  | ResourceContext
  | ((req?: Request) => Promise<ResourceContext>);

type IdentityMapper = (req?: Request) => Promise<IdentityContext>;
type PolicyMapper = (req?: Request) => Promise<PolicyContext>;
```

#### Methods

```ts
function Authz()
function Check(options: CheckOptions)
```

#### Examples
```ts
const app: express.Application = express();


// Standard REST
const restMw = new Middleware({
  client: client,
  policy: {
    name: 'todo',
    instanceLabel: 'todo',
    root: 'todoApp',
  },
  resourceMapper: async (req: express.Request) => {
    if (!req.params?.id) {
      return {};
    }

    const todo = await store.get(req.params.id);
    return { ownerID: todo.OwnerID };
  },
})

app.get("/todos", checkJwt, restMw.Authz(), server.list.bind(server));
app.post("/todos", checkJwt, restMw.Authz(), server.create.bind(server));
app.put("/todos/:id", checkJwt, restMw.Authz(), server.update.bind(server));


// Check
const rebacMw = new Middleware({
  client: authClient,
  policy: {
    name: 'policy-rebac',
    instanceLabel: 'policy-rebac',
    root: 'rebac',
  }
})

// Only users that are in the `evil_genius` group are allowed to delete todos.
app.delete("/todos/:id", checkJwt, rebacMw.Check({
  object: {
    type: "group",
    id: "evil_genius"
  },
  relation: {
    name: "member",
  }
})
```

#### Mappers

##### Identity
To determine the identity of the user, the middleware can be configured to use a JWT token or a claim using the `IdentityMapper`.

```ts
// use the identity type sub
import { SubIdentityMapper } from "@aserto/aserto-node";

const restMw = new Middleware({
  client: authClient,
  policy: policy,
  identityMapper: SubIdentityMapper,
})

// use the jwt type sub from a custom header
import { JWTIdentityMapper } from "@aserto/aserto-node";

const restMw = new Middleware({
  client: authClient,
  policy: policy,
  identityMapper: JWTIdentityMapper("my-header");,
})
```

```ts
// use the manual identity type
import { ManualIdentityMapper } from "@aserto/aserto-node";

const restMw = new Middleware({
  client: authClient,
  policy: policy,
  identityMapper: ManualIdentityMapper("my-identity");,
})
```

The whole identity resolution can be overwritten by providing a custom function.
```ts
// needs to return an IdentityContext
import { identityContext } from "@aserto/aserto-node";

const restMw = new Middleware({
  client: authClient,
  policy: policy,
  identityMapper: async () => {
    return identityContext('test', 'IDENTITY_TYPE_SUB')
  },
})
```

### Policy

The authorization policy's ID and the decision to be evaluated are specified when creating authorization Middleware, but the policy path is often derived from the URL or method being called.

By default, the policy path is derived from the URL path.

To provide custom logic, use a PolicyMapper. For example:

```ts
// needs to return an IdentityContext
import { identityContext } from "@aserto/aserto-node";

const restMw = new Middleware({
  client: authClient,
  policy: policy,
  policyMapper: async () => {
    return policyContext('path', ['decision'])
  }
})
```

#### Resource
A resource can be any structured data that the authorization policy uses to evaluate decisions. By default, the request params are included in the ResourceContext.

This behavior can be overwritten by providing a custom function:

```ts
const restMw = new Middleware({
  client: authClient,
  policy: policy,
  resourceMapper: async () => {
    return { customKey: "customValue" };
  },
})
```

#### Mappers

##### Resource

```ts
// provides a custom resource context,
type ResourceMapper =
  | ResourceContext
  | ((req?: Request) => Promise<ResourceContext>);

// examples
async (req: Request) => { return { customKey: req.params.id } };
// or just a plain resource context
{ customKey: "customValue" }
```

##### Identity

```ts
type IdentityMapper = (req?: Request) => Promise<IdentityContext>;

// You can also use the built-in policyContext function to create a identity context and pass it as the mapper response
identityContext = (value: string, type: keyof IdentityTypeMap)

IdentityTypeMap {
  IDENTITY_TYPE_UNKNOWN: 0;
  IDENTITY_TYPE_NONE: 1;
  IDENTITY_TYPE_SUB: 2;
  IDENTITY_TYPE_JWT: 3;
}

// example
identityContext("morty@the-citadel.com", "IDENTITY_TYPE_SUB")
```

##### Policy

```ts
type PolicyMapper = (req?: Request) => Promise<PolicyContext>;


// You can also use the built-in policyContext function to create a policy context and pass it as the mapper response
policyContext = (policyPath: string, decisionsList: Array<string> = ["allowed"])

// Example
policyContext("todoApp.POST.todos", ["allowed"])
```

## Directory

The Directory APIs can be used to get, set or delete object instances, relation instances and manifests. They can also be used to check whether a user has a permission or relation on an object instance.

### Directory Client

```ts
type ServiceConfig = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
};

type DirectoryV3Config = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  model?: ServiceConfig;
  rejectUnauthorized?: boolean;
}
```

You can initialize a directory client as follows:

```typescript
import { DirectoryServiceV3 } from "@aserto/aserto-node";

const directoryClient = DirectoryServiceV3({
  url: 'localhost:9292',
  tenantId: '1234',
  apiKey: 'my-api-key',
});

- `url`: hostname:port of directory service (_required_)
- `apiKey`: API key for directory service (_required_ if using hosted directory)
- `tenantId`: Aserto tenant ID (_required_ if using hosted directory)
- `rejectUnauthorized`: reject clients with invalid certificates. Defaults to `true`.
- `reader`: ServiceConfig for the reader client(optional)
- `writer`: ServiceConfig for the writer client(option)
- `importer`: ServiceConfig for the importer client(option)
- `exporter`: ServiceConfig for the exporter client(option)
- `model`: ServiceConfig for the model client(option)
```

#### Example
Define a writer client that uses the same credentials but connects to localhost:9393. All other services will have the default configuration
```ts
import { DirectoryServiceV3 } from "@aserto/aserto-node";

const directoryClient = DirectoryServiceV3({
  url: 'localhost:9292',
  tenantId: '1234',
  apiKey: 'my-api-key',
  writer: {
    url: 'localhost:9393'
  }
});
```

### Getting objects and relations

#### 'object' function

`object({ objectType: "type-name", objectId: "object-id" })`:

Get an object instance with the type `type-name` and the id `object-id`. For example:

```typescript
const user = await directoryClient.object({ objectType: 'user', objectId: 'euang@acmecorp.com' });
```

#### 'relation' function

```typescript
  relation({
    subjectType:  'subject-type',
    objectType: 'object-type',
    objectId: 'object-id',
    relation: 'relation-name',
  })
```

Get an array of relations of a certain type for an object instance. For example:

```typescript
const identity = 'euang@acmecorp.com';
const relations = await directoryClient.relation({
  subjectType: 'user',
  objectType: 'identity',
  objectId: identity
  relation: 'identifier',
  objectType: 'identity'
});
```

### Setting objects and relations

#### 'setObject' function

`setObject({ object: $Object })`:

Create an object instance with the specified fields. For example:

```typescript
const user = await directoryClient.setObject(
  {
    object: {
      type: "user",
      id: "test-object",
      properties: {
        displayName: "test object"
      }
    }
  }
);
```

#### 'setRelation' function

`setRelation({ relation: Relation })`:

Create a relation with a specified name between two objects. For example:

```typescript
const relation = await directoryClient.setRelation({
  subjectId: 'subjectId',
  subjectType: 'subjectType',
  relation: 'relationName',
  objectType: 'objectType',
  objectId: 'objectId',
});
```

#### 'deleteObject' function

`deleteObject({ objectType: "type-name", objectId: "object-id", withRelations: false })`:

Deletes an object instance with the specified type and key. For example:

```typescript
await directoryClient.deleteObject({ objectType: 'user', objectId: 'euang@acmecorp.com' });
```


#### 'deleteRelation' function

`deleteRelation({ objectType: string, objectId: string, relation: string, subjectType: string, subjectId: string, subjectRelation: string })`:

Delete a relation:

```typescript
await directoryClient.deleteRelation({
  subjectType: 'subjectType',
  subjectId: 'subjectId',
  relation: 'relationName',
  objectType: 'objectType',
  objectId: 'objectId',
});
```

### Checking permissions and relations

You can evaluate graph queries over the directory, to determine whether a subject (e.g. user) has a permission or a relation to an object instance.

#### 'checkPermission' function

`checkPermission({ objectType: string, objectId: string, permission: string, subjectType: string, subjectId: string, trace: boolean })`:

Check that an `user` object with the key `euang@acmecorp.com` has the `read` permission in the `admin` group:

```typescript
const check = await directoryClient.checkPermission({
  subjectId: 'euang@acmecorp.com',
  subjectType: 'user',
  permission: 'read',
  objectType: 'group',
  objectId: 'admin',
});
```

#### 'checkRelation' function

`checkRelation({ objectType: string, objectId: string, relation: string, subjectType: string, subjectId: string, trace: boolean })`:

Check that `euang@acmecorp.com` has an `identifier` relation to an object with key `euang@acmecorp.com` and type `identity`:

```typescript
const check = directoryClient.checkRelation({
  subjectId: 'euang@acmecorp.com',
  subjectType: 'user',
  name: 'identifier',
  objectType: 'identity',
  objectId: 'euang@acmecorp.com',
});
```

### Example

```typescript
const identity = 'euang@acmecorp.com';
const relation = await directoryClient.relation(
  {
    subjectType: 'user',
    objectType: 'identity',
    objectId: identity,
    relation: 'identifier',
    subjectId: 'euang@acmecorp.com'
  }
);

if (!relation) {
  throw new Error(`No relations found for identity ${identity}`)
};

const user = await directoryClient.object(
  { objectId: relation.subjectId, objectType: relation.subjectType }
);
```

### Manifest

You can get, set, or delete the manifest

#### 'getManifest' function

```ts
await directoryClient.getManifest();
```

#### 'setManifest' function

```ts
await directoryClient.setManifest(`
# yaml-language-server: $schema=https://www.topaz.sh/schema/manifest.json
---
### model ###
model:
  version: 3

### object type definitions ###
types:
  ### display_name: User ###
  user:
    relations:
      ### display_name: user#manager ###
      manager: user

  ### display_name: Identity ###
  identity:
    relations:
      ### display_name: identity#identifier ###
      identifier: user

  ### display_name: Group ###
  group:
    relations:
      ### display_name: group#member ###
      member: user
    permissions:
      read: member
`);
```

#### 'deleteManifest' function

```ts
await directoryClient.deleteManifest();
```

### Import

```ts

const importRequest = createAsyncIterable([
  new ImportRequest({
    msg: {
      case: "object",
      value: {
        id: "id1",
        type: "user",
        properties: {},
        displayName: "name1",
      },
    },
  }),
  new ImportRequest({
    msg: {
      case: "object",
      value: {
        id: "id2",
        type: "user",
        properties: {},
        displayName: "name2",
      },
    },
  }),
  new ImportRequest({
    msg: {
      case: "relation",
      value: {
        objectId: "id1",
        objectType: "user",
        subjectId: "id2",
        subjectType: "user",
        relation: "manager",
      },
    },
  }),
]);

const resp = await directoryClient.import(importRequest);
await (readAsyncIterable(resp))
```

### Export

```ts
const response = await readAsyncIterable(
  await directoryClient.export({ options: "all" })
)
```

## Deprecated Methods

> Note: the `authorizerServiceUrl` option that is used throughout is no longer a URL, but the option name is retained for backward-compatibility. It is now expected to be a hostname that exposes a gRPC binding. Any "https://" prefix is stripped out of the value provided.

### jwtAuthz middleware

`jwtAuthz` is an Express-compatible middleware that you can place in the dispatch pipeline of a route.

You can use the jwtAuthz function together with [express-jwt](https://github.com/auth0/express-jwt) to both validate a JWT and make sure it has the correct permissions to call an endpoint.

```javascript
const jwt = require('express-jwt');
const { jwtAuthz } = require('@aserto/aserto-node');

const options = {
  authorizerServiceUrl: 'localhost:8282', // required - must pass a valid host:port
  policyRoot: 'mycars', // required - must be a string representing the policy root (the first component of the policy module name)
  instanceName: 'instance-name', // optional (required only for a hosted authorizer)
  instanceLabel: 'instance-label' // optional (required only for a hosted authorizer)
};

app.get('/users/:id',
  jwt({ secret: 'shared_secret' }),
  jwtAuthz(options),
  function(req, res) { ... });
```

By default, `jwtAuthz` derives the policy file name and resource key from the Express route path. To override this behavior, two optional parameters are available.

#### arguments

`jwtAuthz(options[, packageName[, resourceMap]])`:

- `options`: a javascript map containing at least `{ authorizerServiceUrl, policyName, policyRoot }` as well as `authorizerApiKey` and `tenantId` for the hosted authorizer
- `packageName`: a string representing the policy package name (optional)
- `resourceMap`: an optional resource context to send the authorizer. This can be either an object or a function that
  takes an HTTP request and returns an object.

#### options argument

- `authorizerServiceUrl`: hostname:port of authorizer service (_required_)
- `policyRoot`: Policy root (_required_)
- `instanceName`: instance name (_required_ if using hosted authorizer)
- `instanceLabel`: instance label (_required_ if using hosted authorizer)
- `authorizerApiKey`: API key for authorizer service (_required_ if using hosted authorizer)
- `tenantId`: Aserto tenant ID (_required_ if using hosted authorizer)
- `authorizerCertFile`: location on the filesystem of the CA certificate that signed the Aserto authorizer self-signed certificate. See the "Certificates" section for more information.
- `disableTlsValidation`: ignore TLS certificate validation when creating a TLS connection to the authorizer. Defaults to false.
- `failWithError`: When set to `true`, will forward errors to `next` instead of ending the response directly.
- `useAuthorizationHeader`: When set to `true`, will forward the Authorization header to the authorizer. The authorizer will crack open the JWT and use that as the identity context. Defaults to `true`.
- `identityHeader`: the name of the header from which to extract the `identity` field to pass into the authorize call. This only happens if `useAuthorizationHeader` is false. Defaults to 'identity'.
- `customUserKey`: The property name to check for the subject key. By default, permissions are checked against `req.user`, but you can change it to be `req.myCustomUserKey` with this option. Defaults to `user`.
- `customSubjectKey`: The property name to check for the subject. By default, permissions are checked against `user.sub`, but you can change it to be `user.myCustomSubjectKey` with this option. Defaults to `sub`.

#### packageName argument

By convention, Aserto policy package names are of the form `policyRoot.METHOD.path`. By default, the package name will be inferred from the policy name, HTTP method, and route path:

- `GET /api/users` --> `policyRoot.GET.api.users`
- `POST /api/users/:id` --> `policyRoot.POST.api.users.__id`

Passing in the `packageName` parameter into the `jwtAuthz()` function will override this behavior.

#### resourceMap argument

By default, the resource map will be req.params. For example, if the route path is `/api/users/:id`, the resource will be `{ 'id': 'value-of-id' }`.

Passing in the `resourceMap` parameter into the `jwtAuthz()` function will override this behavior.

### displayStateMap middleware

Use the displayStateMap middleware to set up an endpoint that returns the display state map to a caller. The endpoint is named `__displaystatemap` by default, but can be overridden in `options`.

```javascript
const { displayStateMap } = require('@aserto/aserto-node');

const options = {
  authorizerServiceUrl: 'localhost:8282', // required - must pass a valid host:port
  policyRoot: 'policy' // required - must be a string representing the policy root (the first component of the policy module name)
};
app.use(displayStateMap(options));
```

#### arguments

`displayStateMap(options)`

#### options argument

- `authorizerServiceUrl`: hostname:port of authorizer service (_required_)
- `policyRoot`: Policy root (_required_)
- `instanceName`: instance name (_required_ if using hosted authorizer)
- `instanceLabel`: instance label (_required_ if using hosted authorizer)
- `authorizerApiKey`: API key for authorizer service (_required_ if using hosted authorizer)
- `tenantId`: Aserto tenant ID (_required_ if using hosted authorizer)
- `authorizerCertFile`: location on the filesystem of the CA certificate that signed the Aserto authorizer self-signed certificate. See the "Certificates" section for more information.
- `disableTlsValidation`: ignore TLS certificate validation when creating a TLS connection to the authorizer. Defaults to false.
- `endpointPath`: display state map endpoint path, defaults to `/__displaystatemap`.
- `failWithError`: When set to `true`, will forward errors to `next` instead of ending the response directly. Defaults to `false`.
- `useAuthorizationHeader`: When set to `true`, will forward the Authorization header to the authorizer. The authorizer will crack open the JWT and use that as the identity context. Defaults to `true`.
- `identityHeader`: the name of the header from which to extract the `identity` field to pass into the displayStateMap call. This only happens if `useAuthorizationHeader` is false. Defaults to 'identity'.
- `customUserKey`: The property name to check for the subject key. By default, permissions are checked against `req.user`, but you can change it to be `req.myCustomUserKey` with this option. Defaults to `user`.
- `customSubjectKey`: The property name to check for the subject. By default, permissions are checked against `user.sub`, but you can change it to be `user.myCustomSubjectKey` with this option. Defaults to `sub`.

### 'is' function

While `jwtAuthz` is meant to be used as dispatch middleware for a route, `is` provides an explicit mechanism for calling the Aserto authorizer.

Use the `is` function to call the authorizer with a `decision`, policy, and resource, and get a boolean `true` or `false` response. The `decision` is a named value in the policy: the string `allowed` is used by convention. Examples: `is('allowed')`, `is('enabled')`, `is('visible')`, etc.

```javascript
const { is } = require('@aserto/aserto-node');

const options = {
  authorizerServiceUrl: 'localhost:8282', // required - must pass a valid host:port
  policyRoot: 'policy' // required - must be a string representing the policy root (the first component of the policy module name)
};

app.get('/users/:id', async function(req, res) {
  try {
    const allowed = await is('allowed', req, options);
    if (allowed) {
      ...
    } else {
      res.status(403).send("Unauthorized");
    }
  } catch (e) {
    res.status(500).send(e.message);
  }
});
```

#### arguments

`is(decision, req, options[, packageName[, resourceMap]])`:

- `decision`: a string representing the name of the decision - typically `allowed` (_required_)
- `req`: Express request object (_required_)
- `options`: a javascript map containing at least `{ authorizerServiceUrl, policyRoot }` as well as `authorizerApiKey` and `tenantId` for the hosted authorizer (_required_)
- `packageName`: a string representing the package name for the the policy (optional)
- `resourceMap`: a map of key/value pairs to use as the resource context for evaluation (optional)

#### decision argument

This is simply a string that is correlates to a decision referenced in the policy: for example, `allowed`, `enabled`, etc.

#### req argument

The Express request object.

#### options argument

- `authorizerServiceUrl`: hostname:port of authorizer service (_required_)
- `policyRoot`: Policy root (_required_)
- `instanceName`: instance name (_required_ if using hosted authorizer)
- `instanceLabel`: instance label (_required_ if using hosted authorizer)
- `authorizerApiKey`: API key for authorizer service (_required_ if using hosted authorizer)
- `tenantId`: Aserto tenant ID (_required_ if using hosted authorizer)
- `authorizerCertFile`: location on the filesystem of the CA certificate that signed the Aserto authorizer self-signed certificate. See the "Certificates" section for more information.
- `disableTlsValidation`: ignore TLS certificate validation when creating a TLS connection to the authorizer. Defaults to false.
- `useAuthorizationHeader`: When set to `true`, will forward the Authorization header to the authorizer. The authorizer will crack open the JWT and use that as the identity context. Defaults to `true`.
- `identityHeader`: the name of the header from which to extract the `identity` field to pass into the `authorize` call. This only happens if `useAuthorizationHeader` is false. Defaults to 'identity'.
- `customUserKey`: The property name to check for the subject key. By default, permissions are checked against `req.user`, but you can change it to be `req.myCustomUserKey` with this option. Defaults to `user`.
- `customSubjectKey`: The property name to check for the subject. By default, permissions are checked against `user.sub`, but you can change it to be `user.myCustomSubjectKey` with this option. Defaults to `sub`.

#### packageName argument

By default, `is` will follow the same heuristic behavior as `jwtAuthz` - it will infer the package name from the policy name, HTTP method, and route path. If provided, the `packageName` argument will override this and specify a policy package to use.

By convention, Aserto Rego policies are named in the form `policyRoot.METHOD.path`. Following the node.js idiom, you can also pass it in as `policyRoot/METHOD/path`, and the path can contain the Express parameter syntax.

For example, passing in `policyRoot/GET/api/users/:id` will resolve to a policy called `policyRoot.GET.api.users.__id`.

#### resourceMap argument

By default, `is` follows the same behavior as `jwtAuthz` in that resource map will be `req.params`. For example, if the route path is `/api/users/:id`, the resource will be `{ 'id': 'value-of-id' }`.

Passing in the `resourceMap` parameter into the `Authz()` function will override this behavior.

The provided value can be either an object or a function that takes an http request and returns an object.

## Certificates

The Topaz / Aserto [authorizers](github.com/aserto-dev/topaz) exposes SSL-only endpoints. In order for a node.js policy to properly communicate with the authorizer, TLS certificates must be verified.

For a hosted authorizer that has a TLS certificate that is signed by a trusted Certificate Authority, this section isn't relevant because that TLS certificate will be successfully validated.

In a development environment, the Aserto [one-box](github.com/aserto-dev/aserto-one) automatically creates a set of self-signed certificates and certificates of the CA (certificate authority) that signed them. It places them in a well-known location on the filesystem, defaulting to `$HOME/.config/aserto/aserto-one/certs/`. For Topaz this is `$HOME/.config/topaz/certs/`.

In order for the `aserto-node` package to perform the TLS handshake, it needs to verify the TLS certificate of the one-box using the certificate of the CA that signed it - which was placed in `$HOME/.config/aserto/aserto-one/certs/aserto-one-gateway-ca.crt`. Therefore, in order for this middleware to work successfully, either the `authorizerCertFile` must be set to the correct path for the CA cert file, or the `disableTlsValidation` flag must be set to `true`.

Furthermore, when packaging a policy for deployment (e.g. in a Docker container) which uses `aserto-node` to communicate with an authorizer that has a self-signed TLS certificate, you must copy this CA certificate into the container as part of the Docker build (typically performed in the Dockerfile). When you do that, you'll need to override the `authorizerCertFile` option that is passed into any of the API calls defined above with the location of this cert file.

Alternately, to ignore TLS certificate validation when creating a TLS connection to the authorizer, you can set the `disableTlsValidation` option to `true` and avoid TLS certificate validation. This option is **not recommended for production**.


## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker.

## Author

[Aserto](https://aserto.com) based on the original work by [Auth0](https://auth0.com).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
