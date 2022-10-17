import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import httpMocks from "node-mocks-http";

import { jwtAuthz } from "../lib/jwtAuthz";

dotenv.config();

describe("should succeed", () => {
  const request: Request = httpMocks.createRequest({
    method: "GET",
    route: {
      path: "/todos",
    },
    headers: {
      authorization:
        "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwOTM5Njg5NTA5OTNkZTk1ZjRkOTVhYmY0NjhmMTQ3OGU3NzA3NTcifQ.eyJpc3MiOiJodHRwczovL2NpdGFkZWwuZGVtby5hc2VydG8uY29tL2RleCIsInN1YiI6IkNpUm1aREEyTVRSa015MWpNemxoTFRRM09ERXRZamRpWkMwNFlqazJaalZoTlRFd01HUVNCV3h2WTJGcyIsImF1ZCI6ImNpdGFkZWwtYXBwIiwiZXhwIjoxNjY2MTEyOTU1LCJpYXQiOjE2NjYwMjY1NTUsIm5vbmNlIjoiZFJTZFdueVdTelBEMDlMaGw4djVvQjdiQndUUmp6eWdTa3ZsTW5laDgxdyIsImF0X2hhc2giOiJzWmVTb3J6NU9PSzNEMUdVTG94OVdBIiwiZW1haWwiOiJyaWNrQHRoZS1jaXRhZGVsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoicmljayJ9.Rk3OyDjFn47L5BlF3VvAfxg8RmBjIciHm24PqcQ9eWLspk2eB6r6VDTbdTGWcn54siCEWlzNRCpXSawhH7sf_ccnvNJVNznyeN2QC6HwS--J38Uu8RpVlQ9f3GeKbqxoAf8SEwj859_ySTXSITdahvmhdHoZNFUYxznzUpU-qQhQW5ujQnmPTWUEzSD-jUVhcKb_7D7UvfAp7vyPa9dFriz1GNZ_yIJtFfNltJPYLmUcrH0cJ79alVClAMLW42KWKu0meQDG6JYBU3ZEGxOtySQcN-WWmzSzln9whboEapKsXobUcVc_tSHrHirlPsgeNF-jnP7KTQ4tS_ua16KdGg",
    },
  });

  it("should return a boolean when all required arguments, packageName, and resourceMap are provided as inputs", async () => {
    const options = {
      policyRoot: "todoApp",
      policyName: "todoApp",
      policyId: "123",
      authorizerServiceUrl: "localhost:8282",
      identityHeader: "Authorization",
      authorizerCertCAFile: process.env.CA_FILE!,
    };

    const next = jest.fn() as unknown as NextFunction;
    const send = jest.fn();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const res = {
      append: jest.fn(),
      status: jest.fn(() => ({ send })),
    } as unknown as Response;
    const response = jwtAuthz(options);

    await response(request, res, next);
    await expect(next).toBeCalled();
  });
});
