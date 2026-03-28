import PiholeApiClient from "../PiholeApiClient.js";
import { mockApiResponse } from "../../__tests__/helpers/testUtils.js";

describe("PiholeApiClient", () => {
  let client;
  let mockFetch;
  const BASE_URL = "http://192.168.1.100/api";

  beforeEach(() => {
    mockFetch = jest.fn();
    client = new PiholeApiClient({ baseUrl: BASE_URL, fetch: mockFetch });
  });

  describe("post", () => {
    it("makes POST requests with correct URL and data", async () => {
      const mockPayload = { foo: "bar" };
      const mockResponse = { name: "John Doe" };

      mockFetch.mockResolvedValueOnce(mockApiResponse(mockResponse));

      const response = await client.post("/example", mockPayload);

      expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/example`, {
        method: "POST",
        body: JSON.stringify(mockPayload),
        headers: { "Content-Type": "application/json" },
      });
      expect(response).toEqual(mockResponse);
    });

    it("includes custom headers in the request", async () => {
      client.setHeader("Authorization", "Bearer token123");
      client.setHeader("Content-Type", "application/json");

      mockFetch.mockResolvedValueOnce(mockApiResponse({}));

      await client.post("/", {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer token123",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("returns null when Content-Length is 0", async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse(null));

      const response = await client.post("/", {});

      expect(response).toBeNull();
    });
  });

  describe("get", () => {
    it("makes GET requests with correct URL", async () => {
      const mockResponse = { name: "John Doe" };

      mockFetch.mockResolvedValueOnce(mockApiResponse(mockResponse));

      const response = await client.get("/example");

      expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/example`, {
        headers: {},
      });
      expect(response).toEqual(mockResponse);
    });

    it("includes custom headers in the request", async () => {
      client.setHeader("Authorization", "Bearer token123");

      mockFetch.mockResolvedValueOnce(mockApiResponse({}));

      await client.get("/");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer token123" },
        })
      );
    });

    it("returns null when Content-Length is 0", async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse(null));

      const response = await client.get("/");

      expect(response).toBeNull();
    });
  });

  describe("delete", () => {
    it("makes DELETE requests with correct URL", async () => {
      const mockResponse = { name: "John Doe" };

      mockFetch.mockResolvedValueOnce(mockApiResponse(mockResponse));

      const response = await client.delete("/example");

      expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/example`, {
        method: "DELETE",
        headers: {},
      });
      expect(response).toEqual(mockResponse);
    });

    it("includes custom headers in the request", async () => {
      client.setHeader("Authorization", "Bearer token123");

      mockFetch.mockResolvedValueOnce(mockApiResponse({}));

      await client.delete("/");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer token123" },
        })
      );
    });

    it("returns null when Content-Length is 0", async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse(null));

      const response = await client.delete("/");

      expect(response).toBeNull();
    });
  });

  describe("error handling", () => {
    const errorCases = [
      { status: 400, message: "Bad Request" },
      { status: 401, message: "Unauthorized" },
      { status: 402, message: "Request failed" },
      { status: 403, message: "Forbidden" },
      { status: 404, message: "Not Found" },
      { status: 500, message: "Internal Server Error" },
    ];

    errorCases.forEach(({ status, message }) => {
      it(`throws ApiError with "${message}" for ${status} status`, async () => {
        mockFetch.mockResolvedValue(mockApiResponse(null, status, false));
        await expect(client.get("/")).rejects.toThrow(message);
      });
    });
  });
});
