# Changelog

## [1.5.0](https://github.com/AdrianoCng/pihole-telegram-bot/compare/v1.4.0...v1.5.0) (2026-10-17)


### Features

* add DEBUG environment variable for enhanced error logging ([#37](https://github.com/AdrianoCng/pihole-telegram-bot/issues/37)) ([5ed04e6](https://github.com/AdrianoCng/pihole-telegram-bot/commit/5ed04e6d8ec279e6c6f95e826c104ce008f7d22a))
* deprecate `PIHOLE_IP` in favour of `PIHOLE_URL` ([33eaaa7](https://github.com/AdrianoCng/pihole-telegram-bot/commit/33eaaa734e68bcb8d07dd96295fd3c2a19ff8142))
* filter /recent by client or domain, with wildcards ([#40](https://github.com/AdrianoCng/pihole-telegram-bot/issues/40)) ([d899e98](https://github.com/AdrianoCng/pihole-telegram-bot/commit/d899e9880366d114e5858e0f9e7555dd295481dd))
* log a startup warning when the deprecated `PIHOLE_IP` is used ([33eaaa7](https://github.com/AdrianoCng/pihole-telegram-bot/commit/33eaaa734e68bcb8d07dd96295fd3c2a19ff8142))

## [1.4.0](https://github.com/AdrianoCng/pihole-telegram-bot/compare/v1.3.0...v1.4.0) (2026-10-10)


### Features

* add /recent command to display recently blocked domains ([#33](https://github.com/AdrianoCng/pihole-telegram-bot/issues/33)) ([9f95735](https://github.com/AdrianoCng/pihole-telegram-bot/commit/9f957357b9b3a7e676b904f2e716ab828a5afcb3))
* add /top command to display top blocked domains and clients ([#31](https://github.com/AdrianoCng/pihole-telegram-bot/issues/31)) ([d4fdfae](https://github.com/AdrianoCng/pihole-telegram-bot/commit/d4fdfae295bd1d6abe5338ef4d9d17fccaaf99f6))
* add timed /pause command ([#28](https://github.com/AdrianoCng/pihole-telegram-bot/issues/28)) ([ffcb56b](https://github.com/AdrianoCng/pihole-telegram-bot/commit/ffcb56b655cbb227283602f97a1f108005a20eae))

## [1.3.0](https://github.com/AdrianoCng/pihole-telegram-bot/compare/v1.2.2...v1.3.0) (2026-09-27)


### Features

* add Pi-hole summary dashboard ([3706e02](https://github.com/AdrianoCng/pihole-telegram-bot/commit/3706e029b9a5fbddc0770b23814d7868e10bea45))
* automatically sign in for Pi-hole reads and refresh expired sessions ([3706e02](https://github.com/AdrianoCng/pihole-telegram-bot/commit/3706e029b9a5fbddc0770b23814d7868e10bea45))


### Bug Fixes

* apply timeouts to Pi-hole requests and host commands ([3706e02](https://github.com/AdrianoCng/pihole-telegram-bot/commit/3706e029b9a5fbddc0770b23814d7868e10bea45))
* end Pi-hole sessions on shutdown and clear sessions after failed logout ([3706e02](https://github.com/AdrianoCng/pihole-telegram-bot/commit/3706e029b9a5fbddc0770b23814d7868e10bea45))
* give consistent, safe error replies for Pi-hole and command failures ([3706e02](https://github.com/AdrianoCng/pihole-telegram-bot/commit/3706e029b9a5fbddc0770b23814d7868e10bea45))
