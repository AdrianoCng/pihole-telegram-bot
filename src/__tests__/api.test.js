import { mockApiResponse, testApiMethodErrors } from "./helpers/testUtils";

describe("api", () => {
  let api;
  const originalENV = process.env;
  const TEST_PIHOLE_IP = "192.168.1.100";

  global.fetch = jest.fn();

  beforeAll(() => {
    process.env = {
      ...originalENV,
      PIHOLE_IP: TEST_PIHOLE_IP,
    };
  });

  afterAll(() => {
    process.env = originalENV;
  });

  beforeAll(async () => {
    // Dynamic import after environment is set
    const apiModule = await import("../api");
    api = apiModule.default;
  });

  beforeEach(() => {
    fetch.mockClear();
    api.headers = {};
  });

  describe("api.post", () => {
    describe("Successful requests", () => {
      it("Should make POST requests with correct URL and data", async () => {
        const mockPayload = {
          foo: "bar",
        };
        const mockPath = "/example";
        const mockResponse = {
          name: "John Doe",
        };

        fetch.mockResolvedValueOnce(mockApiResponse(mockResponse));

        const response = await api.post(mockPath, mockPayload);

        expect(fetch).toHaveBeenCalledWith(`${TEST_PIHOLE_IP}/api${mockPath}`, {
          method: "POST",
          body: JSON.stringify(mockPayload),
          headers: {},
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include custom headers in the request", async () => {
        api.setHeader("Authorization", "Bearer token123");
        api.setHeader("Content-Type", "application/json");

        fetch.mockResolvedValueOnce(mockApiResponse({}));

        await api.post("/", {});

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: "Bearer token123",
              "Content-Type": "application/json",
            },
          })
        );
      });
    });

    describe("Error Handling", () => {
      testApiMethodErrors(() => api.post("/", {}));
    });
  });

  describe("api.get", () => {
    describe("Successful requests", () => {
      it("Should make GET requests with correct URL", async () => {
        const mockPath = "/example";
        const mockResponse = {
          name: "John Doe",
        };

        fetch.mockResolvedValueOnce(mockApiResponse(mockResponse));

        const response = await api.get(mockPath);

        expect(fetch).toHaveBeenCalledWith(`${TEST_PIHOLE_IP}/api${mockPath}`, {
          headers: {},
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include custom headers in the request", async () => {
        api.setHeader("Authorization", "Bearer token123");
        api.setHeader("Content-Type", "application/json");

        fetch.mockResolvedValueOnce(mockApiResponse({}));

        await api.get("/");

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: "Bearer token123",
              "Content-Type": "application/json",
            },
          })
        );
      });
    });

    describe("Error Handling", () => {
      testApiMethodErrors(() => api.get("/"));
    });
  });

  describe("api.delete", () => {
    describe("Successful requests", () => {
      it("Should make DELETE requests with correct URL", async () => {
        const mockPath = "/example";
        const mockResponse = {
          name: "John Doe",
        };

        fetch.mockResolvedValueOnce(mockApiResponse(mockResponse));

        const response = await api.delete(mockPath);

        expect(fetch).toHaveBeenCalledWith(`${TEST_PIHOLE_IP}/api${mockPath}`, {
          method: "DELETE",
          headers: {},
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include custom headers in the request", async () => {
        api.setHeader("Authorization", "Bearer token123");
        api.setHeader("Content-Type", "application/json");

        fetch.mockResolvedValueOnce(mockApiResponse({}));

        await api.delete("/");

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: "Bearer token123",
              "Content-Type": "application/json",
            },
          })
        );
      });
    });

    describe("Error Handling", () => {
      testApiMethodErrors(() => api.delete("/"));
    });
  });
});
