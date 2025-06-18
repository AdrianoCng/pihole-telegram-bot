import ApiError from "../ApiError";

global.fetch = jest.fn();

const originalENV = process.env;
const TEST_PIHOLE_IP = "192.168.1.100";

beforeAll(() => {
  process.env = {
    ...originalENV,
    PIHOLE_IP: TEST_PIHOLE_IP,
  };
});

afterAll(() => {
  process.env = originalENV;
});

describe("api", () => {
  let api;

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

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        });

        const response = await api.post(mockPath, mockPayload);

        expect(fetch).toHaveBeenCalledWith(`${TEST_PIHOLE_IP}/api${mockPath}`, {
          method: "POST",
          body: JSON.stringify(mockPayload),
          headers: {},
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include custom headers in the request", () => {
        api.setHeader("Authorization", "Bearer token123");
        api.setHeader("Content-Type", "application/json");

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        });

        api.post("/", {});

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
      it("Should throw ApiError for 400 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 400,
        });

        expect(api.post("/", {})).rejects.toThrow(ApiError);
        expect(api.post("/", {})).rejects.toThrow("Bad Request");
      });

      it("Should throw ApiError for 401 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 401,
        });

        expect(api.post("/", {})).rejects.toThrow(ApiError);
        expect(api.post("/", {})).rejects.toThrow("Unauthorized");
      });

      it("Should throw ApiError for 402 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 402,
        });

        expect(api.post("/", {})).rejects.toThrow(ApiError);
        expect(api.post("/", {})).rejects.toThrow("Request failed");
      });

      it("Should throw ApiError for 403 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 403,
        });

        expect(api.post("/", {})).rejects.toThrow(ApiError);
        expect(api.post("/", {})).rejects.toThrow("Forbidden");
      });

      it("Should throw ApiError for 404 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 404,
        });

        expect(api.post("/", {})).rejects.toThrow(ApiError);
        expect(api.post("/", {})).rejects.toThrow("Not Found");
      });

      it('Should throw ApiError with "Internal Server Error" for unmapped status codes', () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        expect(api.post("/", {})).rejects.toThrow(ApiError);
        expect(api.post("/", {})).rejects.toThrow("Internal Server Error");
      });
    });
  });

  describe("api.get", () => {
    describe("Successful requests", () => {
      it("Should make GET requests with correct URL", async () => {
        const mockPath = "/example";
        const mockResponse = {
          name: "John Doe",
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        });

        const response = await api.get(mockPath);

        expect(fetch).toHaveBeenCalledWith(`${TEST_PIHOLE_IP}/api${mockPath}`, {
          headers: {},
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include custom headers in the request", () => {
        api.setHeader("Authorization", "Bearer token123");
        api.setHeader("Content-Type", "application/json");

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        });

        api.get("/");

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
      it("Should throw ApiError for 400 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 400,
        });

        expect(api.get("/")).rejects.toThrow(ApiError);
        expect(api.get("/")).rejects.toThrow("Bad Request");
      });

      it("Should throw ApiError for 401 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 401,
        });

        expect(api.get("/")).rejects.toThrow(ApiError);
        expect(api.get("/")).rejects.toThrow("Unauthorized");
      });

      it("Should throw ApiError for 402 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 402,
        });

        expect(api.get("/")).rejects.toThrow(ApiError);
        expect(api.get("/")).rejects.toThrow("Request failed");
      });

      it("Should throw ApiError for 403 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 403,
        });

        expect(api.get("/")).rejects.toThrow(ApiError);
        expect(api.get("/")).rejects.toThrow("Forbidden");
      });

      it("Should throw ApiError for 404 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 404,
        });

        expect(api.get("/")).rejects.toThrow(ApiError);
        expect(api.get("/")).rejects.toThrow("Not Found");
      });

      it('Should throw ApiError with "Internal Server Error" for unmapped status codes', () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        expect(api.get("/")).rejects.toThrow(ApiError);
        expect(api.get("/")).rejects.toThrow("Internal Server Error");
      });
    });
  });

  describe("api.delete", () => {
    describe("Successful requests", () => {
      it("Should make DELETE requests with correct URL", async () => {
        const mockPath = "/example";
        const mockResponse = {
          name: "John Doe",
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        });

        const response = await api.delete(mockPath);

        expect(fetch).toHaveBeenCalledWith(`${TEST_PIHOLE_IP}/api${mockPath}`, {
          method: "DELETE",
          headers: {},
        });
        expect(response).toEqual(mockResponse);
      });

      it("Should include custom headers in the request", () => {
        api.setHeader("Authorization", "Bearer token123");
        api.setHeader("Content-Type", "application/json");

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        });

        api.delete("/");

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
      it("Should throw ApiError for 400 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 400,
        });

        expect(api.delete("/")).rejects.toThrow(ApiError);
        expect(api.delete("/")).rejects.toThrow("Bad Request");
      });

      it("Should throw ApiError for 401 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 401,
        });

        expect(api.delete("/")).rejects.toThrow(ApiError);
        expect(api.delete("/")).rejects.toThrow("Unauthorized");
      });

      it("Should throw ApiError for 402 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 402,
        });

        expect(api.delete("/")).rejects.toThrow(ApiError);
        expect(api.delete("/")).rejects.toThrow("Request failed");
      });

      it("Should throw ApiError for 403 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 403,
        });

        expect(api.delete("/")).rejects.toThrow(ApiError);
        expect(api.delete("/")).rejects.toThrow("Forbidden");
      });

      it("Should throw ApiError for 404 Request failed", () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 404,
        });

        expect(api.delete("/")).rejects.toThrow(ApiError);
        expect(api.delete("/")).rejects.toThrow("Not Found");
      });

      it('Should throw ApiError with "Internal Server Error" for unmapped status codes', () => {
        fetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        expect(api.delete("/")).rejects.toThrow(ApiError);
        expect(api.delete("/")).rejects.toThrow("Internal Server Error");
      });
    });
  });
});
