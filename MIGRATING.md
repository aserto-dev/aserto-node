# To 0.33.x migration guide

0.33.x updates the SDK from Connect v1 to Connect v2

Connect v2 provides new features and simplifies some common APIs. In addition,
it makes use of all the [enhancements of Protobuf-ES v2](https://buf.build/blog/protobuf-es-v2).

> [!IMPORTANT]
>
> - Node 16 is no longer supported. The SDK now supports Node versions **18.14.1** and up.
> - TypeScript 4.1 is no longer supported. The SDK now requires at least TypeScript **v4.9.5**.

## Deprecations

#### objectPropertiesAsStruct

 `objectPropertiesAsStruct` has been deprecated. The new SDK allows passing JSON objects directly as properties

#### createAsyncIterable
Usage of `createAsyncIterable` in the context of creating import requests has been deprecated and is replaced with `createImportRequest`.

If you want to use the old implementation of `createAsyncIterable` you can import it directly from  `import { createAsyncIterable } from "@connectrpc/connect/protocol";`

#### Example:
```diff
-import { ImportMsgCase, ImportOpCode, objectPropertiesAsStruct, createAsyncIterable } from "@aserto/aserto-node"
-const importRequest = createAsyncIterable([
+import { ImportMsgCase, ImportOpCode, createImportRequest } from "@aserto/aserto-node"
+const importRequest = createImportRequest(
  [
    {
      opCode: ImportOpCode.SET,
      msg: {
        value: {
          id: "import-user",
          type: "user",
-         properties: objectPropertiesAsStruct({ foo: "bar" }),
+         properties: { foo: "bar" },
          displayName: "name1",
        },
      },
    }
  ]
);
```

## Changes

#### `.object` returns a `Promise<GetObjectResponse>` instead of a custom type.
```ts
type GetObjectResponse = Message<"aserto.directory.reader.v3.GetObjectResponse"> & {
    result?: Object$;
    relations: Relation[];
    page?: PaginationResponse;
}
```

This requires reading the `result` property from the response to get the actual object.

```ts
const userResponse = await directoryClient.object({ objectType: 'user', objectId: 'euang@acmecorp.com' });

const userObject = userResponse.result
```

#### `.objectMany` returns a `Promise<GetObjectManyResponse>` instead of a custom type.

```ts
type GetObjectManyResponse = Message<"aserto.directory.reader.v3.GetObjectManyResponse"> & {
    results: Object$[];
}
```

This requires reading the `results` property from the response to get the actual object.

#### `checkPermission` and `checkRelation` are replaced by a single `check` function that can evaluate both permissions and relations.

```diff
 Check that an `user` object with the key `euang@acmecorp.com` has the `read` permission in the `admin` group:

-const check = await directoryClient.checkPermission({
+const check = await directoryClient.check({
   subjectId: 'euang@acmecorp.com',
   subjectType: 'user',
-  permission: 'read',
+  relation: 'read',
   objectType: 'group',
   objectId: 'admin',
 });
```
 Check that `euang@acmecorp.com` has an `identifier` relation to an object with key `euang@acmecorp.com` and type `identity`:
m
```diff
-const check = directoryClient.checkRelation({
+const check = directoryClient.check({
   subjectId: 'euang@acmecorp.com',
   subjectType: 'user',
   relation: 'identifier',
   objectType: 'identity',
   objectId: 'euang@acmecorp.com',
 });
```


#### Reading object properties is now simplified, enabling direct access.
```diff
const object = await directoryClient.object({objectType: 'user', objectId: "key"});
-  const owner = object?.properties?.fields?.owner?.kind?.value as string
+  const { owner } = object.result.properties
```
