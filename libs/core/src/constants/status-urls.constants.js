'use strict';
// libs/core/src/constants/status-urls.constants.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.StatusUrls = exports.ThirdPartyStatusUrls = void 0;
const domain_constants_1 = require('./domain.constants');
const route_constants_1 = require('./route.constants');
const service_constants_1 = require('./service.constants');
exports.ThirdPartyStatusUrls = {
  google: 'https://www.google.com/appsstatus/dashboard/',
  discord: 'https://status.discord.com/',
  github: 'https://www.githubstatus.com/',
  facebook: 'https://metastatus.com/',
  twitch: 'https://status.twitch.tv/',
  steam: 'https://store.steampowered.com/stats/',
  epicGames: 'https://status.epicgames.com/',
  clerk: 'https://status.clerk.com/',
  cloudflare: 'https://www.cloudflarestatus.com/',
};
exports.StatusUrls = {
  production: {
    [service_constants_1.FrontendService]: `https://${domain_constants_1.PrimaryDomain}`,
    [service_constants_1.AuthService]: `https://${domain_constants_1.ApiDomain}/V1/services/auth${route_constants_1.HealthRoute}`,
    [service_constants_1.UserService]: `https://${domain_constants_1.ApiDomain}/V1/services/user${route_constants_1.HealthRoute}`,
  },
  local: {
    [service_constants_1.FrontendService]: `http://localhost:${service_constants_1.FrontendPort}`,
    [service_constants_1.AuthService]: `http://localhost:${service_constants_1.AuthPort}${route_constants_1.HealthRoute}`,
    [service_constants_1.UserService]: `http://localhost:${service_constants_1.UserPort}${route_constants_1.HealthRoute}`,
  },
};
//# sourceMappingURL=status-urls.constants.js.map
