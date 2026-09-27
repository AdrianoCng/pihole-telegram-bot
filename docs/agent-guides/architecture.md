# Architecture and error handling

- `index.js` is the application entrypoint.
- Declare Telegram commands in the registry at `src/constants/commands.js`.
- Keep controllers in `src/controllers/` focused on Telegram replies and delegation. Await replies and let failures propagate to the central bot error handler.
- Put Pi-hole and system operations in `src/services/`; use `src/helpers/` for shared formatting and execution.
- Put application constants in `src/constants/` and error definitions and classification in `src/errors/`.
- The central bot error handler is `src/middlewares/errorHandler.js`. Middleware also handles authentication and typing indicators.
