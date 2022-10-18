import dotenv from "dotenv";
import { Request } from "express";

import { is } from "../lib/is";

dotenv.config();

describe("should succeed", () => {
  // const mockedAxios = axios as jest.Mocked<typeof axios>;

  it("should return a boolean when all required arguments, packageName, and resourceMap are provided as inputs", async () => {
    const decision = "allowed";
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const req = {
      headers: {
        authorization:
          "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwOTM5Njg5NTA5OTNkZTk1ZjRkOTVhYmY0NjhmMTQ3OGU3NzA3NTcifQ.eyJpc3MiOiJodHRwczovL2NpdGFkZWwuZGVtby5hc2VydG8uY29tL2RleCIsInN1YiI6IkNpUm1aREEyTVRSa015MWpNemxoTFRRM09ERXRZamRpWkMwNFlqazJaalZoTlRFd01HUVNCV3h2WTJGcyIsImF1ZCI6ImNpdGFkZWwtYXBwIiwiZXhwIjoxNjY2MTEyOTU1LCJpYXQiOjE2NjYwMjY1NTUsIm5vbmNlIjoiZFJTZFdueVdTelBEMDlMaGw4djVvQjdiQndUUmp6eWdTa3ZsTW5laDgxdyIsImF0X2hhc2giOiJzWmVTb3J6NU9PSzNEMUdVTG94OVdBIiwiZW1haWwiOiJyaWNrQHRoZS1jaXRhZGVsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoicmljayJ9.Rk3OyDjFn47L5BlF3VvAfxg8RmBjIciHm24PqcQ9eWLspk2eB6r6VDTbdTGWcn54siCEWlzNRCpXSawhH7sf_ccnvNJVNznyeN2QC6HwS--J38Uu8RpVlQ9f3GeKbqxoAf8SEwj859_ySTXSITdahvmhdHoZNFUYxznzUpU-qQhQW5ujQnmPTWUEzSD-jUVhcKb_7D7UvfAp7vyPa9dFriz1GNZ_yIJtFfNltJPYLmUcrH0cJ79alVClAMLW42KWKu0meQDG6JYBU3ZEGxOtySQcN-WWmzSzln9whboEapKsXobUcVc_tSHrHirlPsgeNF-jnP7KTQ4tS_ua16KdGg",
      },
    } as Request;

    const packageName = "GET.todos";
    const resourceMap = { id: "value-of-id" };

    const options = {
      policyRoot: "todoApp",
      policyId: "123",
      authorizerServiceUrl: "localhost:8282",
      identityHeader: "Authorization",
      authorizerCertCAFile: process.env.CA_FILE!,
    };

    const allowed = await is(decision, req, options, packageName, resourceMap);

    expect(allowed).toBe(true);
  });

  it("should return a boolean when all required arguments are provided as inputs and req object is populated", async () => {
    const decision = "allowed";

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const req = {
      headers: {
        authorization:
          "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwOTM5Njg5NTA5OTNkZTk1ZjRkOTVhYmY0NjhmMTQ3OGU3NzA3NTcifQ.eyJpc3MiOiJodHRwczovL2NpdGFkZWwuZGVtby5hc2VydG8uY29tL2RleCIsInN1YiI6IkNpUm1aREEyTVRSa015MWpNemxoTFRRM09ERXRZamRpWkMwNFlqazJaalZoTlRFd01HUVNCV3h2WTJGcyIsImF1ZCI6ImNpdGFkZWwtYXBwIiwiZXhwIjoxNjY2MTEyOTU1LCJpYXQiOjE2NjYwMjY1NTUsIm5vbmNlIjoiZFJTZFdueVdTelBEMDlMaGw4djVvQjdiQndUUmp6eWdTa3ZsTW5laDgxdyIsImF0X2hhc2giOiJzWmVTb3J6NU9PSzNEMUdVTG94OVdBIiwiZW1haWwiOiJyaWNrQHRoZS1jaXRhZGVsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoicmljayJ9.Rk3OyDjFn47L5BlF3VvAfxg8RmBjIciHm24PqcQ9eWLspk2eB6r6VDTbdTGWcn54siCEWlzNRCpXSawhH7sf_ccnvNJVNznyeN2QC6HwS--J38Uu8RpVlQ9f3GeKbqxoAf8SEwj859_ySTXSITdahvmhdHoZNFUYxznzUpU-qQhQW5ujQnmPTWUEzSD-jUVhcKb_7D7UvfAp7vyPa9dFriz1GNZ_yIJtFfNltJPYLmUcrH0cJ79alVClAMLW42KWKu0meQDG6JYBU3ZEGxOtySQcN-WWmzSzln9whboEapKsXobUcVc_tSHrHirlPsgeNF-jnP7KTQ4tS_ua16KdGg",
      },
      params: { id: "value-of-id" },
      method: "GET",
      route: {
        path: "/todos",
      },
    } as unknown as Request;

    const options = {
      policyRoot: "todoApp",
      policyId: "123",
      authorizerServiceUrl: "localhost:8282",
      identityHeader: "Authorization",
      // TODO: Remove
      authorizerCertCAFile: process.env.CA_FILE!,
    };

    const allowed = await is(decision, req, options);

    expect(allowed).toBe(true);
  });
});
