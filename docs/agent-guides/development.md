# Development and testing

## Run the bot

- `npm run dev` starts development with nodemon.
- `npm start` starts the bot with Node.js.
- `npm run start:prod` starts the bot with PM2.

## Test

- `npm test` runs the full Vitest suite once.
- `npm test -- src/__tests__/api.test.js` runs one suite.
- `npm run test:watch` reruns tests on changes.
- `npm run test:coverage` generates an informational V8 coverage report; it has no threshold.
- Place tests in `__tests__/` directories near the code they cover.
- Never run real reboot, upgrade, or pihole operations in tests
