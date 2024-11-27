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
Usage of `createAsyncIterable` in the context of creating import requests has been deprecated and will be replaced with `createImportRequest`.

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

## Serialization and deserialization of data

Response Messages no longer implement the magic toJSON method, which serializes a message with the Protobuf JSON format when it's passed to `JSON.stringify`. Make sure to always serializes to JSON with the toJson or toJsonString function.

```ts
import { GetObjectsResponseSchema } from '@aserto/aserto-node'
import { toJson } from "@bufbuild/protobuf";

const response = await directoryClient.objects({
  objectType: "user",
  page: { token: "" },
});

const json = toJson(GetObjectsResponseSchema, response)
```

The same applies to the methods `equals`, `clone`, `toJson`, and `toJsonString`, and to the static methods `fromBinary`, `fromJson`, `fromJsonString`.


#### Reading object properties is now simplified, enabling direct access.
```diff
const object = await directoryClient.object({objectType: 'user', objectId: "key"});
-  const owner = object?.properties?.fields?.owner?.kind?.value as string
+  const { owner } = object.result.properties
```

## Troubleshooting

#### Express.js
```ts
app.get("/api/users/:id", async (req, res) => {
  const id = req.params.id;
  const user = await directoryClient.object({objectType: 'user', objectId: "key"});
  res.status(200).send(user);
})
```

```
express/lib/response.js:1160
    : JSON.stringify(value);
           ^
TypeError: Do not know how to serialize a BigInt
    at JSON.stringify (<anonymous>)
    at stringify (express/lib/response.js:1160:12)
```

This requires [data serialization](#serialization-and-deserialization-of-data):

```ts
import { GetObjectsResponseSchema } from '@aserto/aserto-node'
import { toJson } from "@bufbuild/protobuf";

app.get("/api/users/:id", async (req, res) => {
  const id = req.params.id;
  const user = await directoryClient.object({objectType: 'user', objectId: "key"});
  const data = toJson(GetObjectResponseSchema, user)
  res.status(200).send(data);
})
```
