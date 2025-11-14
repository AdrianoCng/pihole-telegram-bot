/**
 * Shared test utilities for creating consistent mocks and reducing test boilerplate
 */

/**
 * Creates a mock Telegraf context object with common properties
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Object} Mock context object
 */
export const createMockContext = (overrides = {}) => {
  return {
    from: {
      id: 123,
      ...overrides.from,
    },
    chat: {
      id: 123,
      ...overrides.chat,
    },
    reply: jest.fn(),
    ...overrides,
  };
};

/**
 * Creates a mock API response object
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {boolean} ok - Whether the response is ok
 * @returns {Object} Mock response object
 */
export const mockApiResponse = (data, status = 200, ok = true) => {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  };
};

/**
 * Test helper for parameterized error case testing
 * @param {Function} apiMethod - The API method to test (e.g., () => api.get("/"))
 */
export const testApiMethodErrors = (apiMethod) => {
  const errorCases = [
    { status: 400, message: "Bad Request" },
    { status: 401, message: "Unauthorized" },
    { status: 402, message: "Request failed" },
    { status: 403, message: "Forbidden" },
    { status: 404, message: "Not Found" },
    { status: 500, message: "Internal Server Error" },
  ];

  errorCases.forEach(({ status, message }) => {
    it(`Should throw ApiError with "${message}" for ${status} status`, () => {
      global.fetch.mockResolvedValue(mockApiResponse(null, status, false));
      expect(apiMethod()).rejects.toThrow(message);
    });
  });
};

/**
 * Creates a mock child process object for testing spawn/exec commands
 * @param {Object} options - Configuration options
 * @param {string} options.stdoutData - Data to emit on stdout
 * @param {string} options.stderrData - Data to emit on stderr
 * @param {number} options.exitCode - Exit code for the process
 * @returns {Object} Mock process object
 */
export const createMockProcess = (options = {}) => {
  const { stdoutData = "", stderrData = "", exitCode = 0 } = options;

  const stdoutOnMock = jest.fn((event, callback) => {
    if (event === "data" && stdoutData) {
      callback(Buffer.from(stdoutData));
    }
  });

  const stderrOnMock = jest.fn((event, callback) => {
    if (event === "data" && stderrData) {
      callback(Buffer.from(stderrData));
    }
  });

  const processOnMock = jest.fn((event, callback) => {
    if (event === "close") {
      callback(exitCode);
    }
  });

  return {
    on: processOnMock,
    stdout: {
      on: stdoutOnMock,
    },
    stderr: {
      on: stderrOnMock,
    },
  };
};

/**
 * Setup standard API mocks for tests
 * @returns {Object} Mock functions
 */
export const setupApiMocks = () => {
  const post = jest.fn();
  const get = jest.fn();
  const deleteFn = jest.fn();
  const setHeader = jest.fn();

  return {
    post,
    get,
    delete: deleteFn,
    setHeader,
  };
};
