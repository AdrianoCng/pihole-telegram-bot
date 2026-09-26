import { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { mockApiResponse, testApiMethodErrors } from "./helpers/testUtils";

describe("api", () => {
  let api;
  const originalENV = process.env;
  const TEST_PIHOLE_IP = "192.168.1.100";

  const originalFetch = global.fetch;
  global.fetch = jest.fn();

  beforeAll(() => {
    process.env = {
      ...originalENV,
      PIHOLE_IP: TEST_PIHOLE_IP,
    };
  });

  afterAll(() => {
    process.env = originalENV;
    global.fetch = originalFetch;
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
          headers: { "Content-Type": "application/json" },
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include the session header in the request", async () => {
        api.setSession("test-sid");

        fetch.mockResolvedValueOnce(mockApiResponse({}));

        await api.post("/", {});

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { "Content-Type": "application/json", sid: "test-sid" },
          })
        );
      });

      it("Should return null when Content-Length is 0", async () => {
        const mockResponse = mockApiResponse(null);
        fetch.mockResolvedValueOnce(mockResponse);

        const response = await api.post("/", {});

        expect(response).toBeNull();
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

      it("Should include the session header in the request", async () => {
        api.setSession("test-sid");

        fetch.mockResolvedValueOnce(mockApiResponse({}));

        await api.get("/");

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ headers: { sid: "test-sid" } })
        );
      });

      it("Should return null when Content-Length is 0", async () => {
        const mockResponse = mockApiResponse(null);
        fetch.mockResolvedValueOnce(mockResponse);

        const response = await api.get("/");

        expect(response).toBeNull();
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

      it("Should include the session header in the request", async () => {
        api.setSession("test-sid");

        fetch.mockResolvedValueOnce(mockApiResponse({}));

        await api.delete("/");

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ headers: { sid: "test-sid" } })
        );
      });

      it("Should return null when Content-Length is 0", async () => {
        const mockResponse = mockApiResponse(null);
        fetch.mockResolvedValueOnce(mockResponse);

        const response = await api.delete("/");

        expect(response).toBeNull();
      });
    });

    describe("Error Handling", () => {
      testApiMethodErrors(() => api.delete("/"));
    });
  });

  describe("request signals", () => {
    const signal = new AbortController().signal;

    it.each([
      ["post", () => api.post("/", {}, { signal })],
      ["get", () => api.get("/", { signal })],
      ["delete", () => api.delete("/", { signal })],
    ])("passes the abort signal to fetch for %s", async (_method, request) => {
      fetch.mockResolvedValueOnce(mockApiResponse({}));

      await request();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal })
      );
    });
  });

  describe("session headers", () => {
    it("reports no session when the sid header is missing", () => {
      expect(api.hasSession()).toBe(false);
    });

    it("does not treat an empty sid as a session", () => {
      api.headers.sid = "";
      expect(api.hasSession()).toBe(false);
    });

    it("stores and clears the session", () => {
      api.setSession("test-sid");
      expect(api.hasSession()).toBe(true);
      expect(api.headers).toEqual({ sid: "test-sid" });

      api.clearSession();
      expect(api.hasSession()).toBe(false);
      expect(api.headers).toEqual({});
    });
  });

  describe("error type", () => {
    it.each([
      ["post", "/post-path", () => api.post("/post-path", {})],
      ["get", "/get-path", () => api.get("/get-path")],
      ["delete", "/delete-path", () => api.delete("/delete-path")],
    ])("throws a PiholeError carrying the HTTP status and path for %s", async (_method, path, request) => {
      fetch.mockResolvedValueOnce(mockApiResponse(null, 401, false));

      await expect(request()).rejects.toMatchObject({
        name: "PiholeError",
        code: PIHOLE_ERROR_CODES.HTTP,
        status: 401,
        message: "Unauthorized",
        path,
      });
    });
  });
});
