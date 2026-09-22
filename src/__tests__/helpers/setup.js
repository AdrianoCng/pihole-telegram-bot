// Fixed fixtures keep module initialization independent of local secrets.
process.env.PIHOLE_IP = "http://pihole.test";
process.env.BOT_TOKEN = "123:test-token";
