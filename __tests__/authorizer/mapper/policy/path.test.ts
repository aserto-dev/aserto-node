import httpMocks from "node-mocks-http";

import PolicyPathMapper from "../../../../lib/authorizer/mapper/policy/path";
import policyContext from "../../../../lib/authorizer/model/policyContext";

describe("PolicyPathMapper", () => {
  [
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "",
        },
      }),
      EXPECTED: policyContext("app.GET"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "DELETE",
        route: {
          path: "",
        },
      }),
      EXPECTED: policyContext("app.DELETE"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "PATCH",
        route: {
          path: "",
        },
      }),
      EXPECTED: policyContext("app.PATCH"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "PUT",
        route: {
          path: "",
        },
      }),
      EXPECTED: policyContext("app.PUT"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "POST",
        route: {
          path: "/foo",
        },
      }),
      EXPECTED: policyContext("app.POST.foo"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/foo",
        },
      }),
      EXPECTED: policyContext("app.GET.foo"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/en-us/api",
        },
      }),
      EXPECTED: policyContext("app.GET.en_us.api"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/en-us",
        },
        query: {
          view: 3,
        },
      }),
      EXPECTED: policyContext("app.GET.en_us"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/v1",
        },
        query: {
          view: 3,
        },
      }),
      EXPECTED: policyContext("app.GET.v1"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/dotted.endpoint",
        },
        query: {
          view: 3,
        },
      }),
      EXPECTED: policyContext("app.GET.dotted.endpoint"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/numeric/123456/1",
        },
        query: {
          view: 3,
        },
      }),
      EXPECTED: policyContext("app.GET.numeric.123456.1"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "GET",
        route: {
          path: "/users/:id",
        },
        params: {
          id: 42,
        },
      }),
      EXPECTED: policyContext("app.GET.users.__id"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "POST",
        route: {
          path: "/users/:id",
        },
        params: {
          id: 42,
        },
      }),
      EXPECTED: policyContext("app.POST.users.__id"),
    },
    {
      REQUEST: httpMocks.createRequest({
        method: "DELETE",
        route: {
          path: "/users/:id",
        },
        params: {
          id: 42,
        },
      }),
      EXPECTED: policyContext("app.DELETE.users.__id"),
    },
  ].forEach((example) => {
    it(`maps correctly ${example.REQUEST.method} ${example.REQUEST.route.path} `, () => {
      const policyRoot = "app";
      const result = PolicyPathMapper(policyRoot, example.REQUEST);

      expect(result).toEqual(example.EXPECTED);
    });
  });
});
