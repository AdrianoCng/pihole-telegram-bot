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
  const contentLength = data !== null && data !== undefined ? JSON.stringify(data).length : 0;
  
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    headers: {
      get: (name) => {
        if (name === "Content-Length") {
          return contentLength.toString();
        }
        return null;
      },
    },
  };
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

