# aserto-node

Aserto authorization middleware for the node Express server, based on
Auth0's [express-jwt-authz](https://github.com/auth0/express-jwt-authz)
package.

This package provides four capabilities:

1. `jwtAuthz`: middleware that sits on a route, and validates a request to authorize access to that route.
2. `displayStateMap`: middleware that adds an endpoint for returning the display state map for a service, based on its authorization policy.
3. `is`: a function that can be called to make a decision about a user's access to a resource based on a policy.
4. `ds`: an object containing the `object` and `relation` functions, which can be called to retrieve an object or relation, respectively, from the directory.

The first three capabilities call out to an authorizer service, which must be configured as part of the `options` map passed in.

The fourth calls out to a directory service.

## Installation

    $ npm install aserto-node

> `express@^4.0.0` is a peer dependency. Make sure it is installed in your project.

## Usage

> Note: the `authorizerServiceUrl` option that is used throughout is no longer a URL, but the option name is retained for backward-compatibility. It is now expected to be a hostname that exposes a gRPC binding. Any "https://" prefix is stripped out of the value provided.

### jwtAuthz middleware

`jwtAuthz` is an Express-compatible middleware that you can place in the dispatch pipeline of a route.

You can use the jwtAuthz function together with [express-jwt](https://github.com/auth0/express-jwt) to both validate a JWT and make sure it has the correct permissions to call an endpoint.

```javascript
const jwt = require('express-jwt');
const { jwtAuthz } = require('aserto-node');

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
const { displayStateMap } = require('aserto-node');

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
const { is } = require('aserto-node');

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

By default, `is` will follow the same heuristic behavior as `jwtAuthz` - it will infer the packge name from the policy name, HTTP method, and route path. If provided, the `packageName` argument will override this and specify a policy package to use.

By convention, Aserto Rego policies are named in the form `policyRoot.METHOD.path`. Following the node.js idiom, you can also pass it in as `policyRoot/METHOD/path`, and the path can contain the Express parameter syntax.

For example, passing in `policyRoot/GET/api/users/:id` will resolve to a policy called `policyRoot.GET.api.users.__id`.

#### resourceMap argument

By default, `is` follows the same behavior as `jwtAuthz` in that resource map will be `req.params`. For example, if the route path is `/api/users/:id`, the resource will be `{ 'id': 'value-of-id' }`.

Passing in the `resourceMap` parameter into the `is()` function will override this behavior.

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
