// Fixed fixtures keep module initialization independent of local secrets.
process.env.PIHOLE_URL = "http://pihole.test";
process.env.BOT_TOKEN = "123:test-token";
process.env.PIHOLE_PASSWORD = "test-password";
process.env.ALLOWED_USER = "123";
