/**
 * @typedef {Object} HttpClient
 * @property {(path: string) => Promise<any>} get
 * @property {(path: string, data: any) => Promise<any>} post
 * @property {(path: string) => Promise<any>} delete
 * @property {(key: string, value: string) => void} setHeader
 */

/**
 * @typedef {Object} MessageSender
 * @property {(ctx: any, message: string, extra?: any) => void} send
 */

/**
 * @typedef {Object} CommandExecutor
 * @property {(ctx: any, command: string, args?: string[]) => Promise<void>} exec
 */

/**
 * @typedef {Object} PiholeExecutor
 * @property {(ctx: any, args: string[]) => Promise<void>} exec
 */

/**
 * @typedef {Object} Config
 * @property {(key: string) => string} get
 */

/**
 * @typedef {Object} CommandDefinition
 * @property {string|string[]} trigger
 * @property {string} description
 * @property {(ctx: any) => Promise<void>} handler
 * @property {boolean} [showInKeyboard]
 */

export {};
