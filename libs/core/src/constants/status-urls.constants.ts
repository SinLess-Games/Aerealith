// libs/core/src/constants/status-urls.constants.ts

import { ApiDomain, PrimaryDomain } from './domain.constants';
import { HealthRoute } from './route.constants';
import {
  AuthPort,
  AuthService,
  FrontendPort,
  FrontendService,
  UserPort,
  UserService,
} from './service.constants';

export const ThirdPartyStatusUrls = {
  google: 'https://www.google.com/appsstatus/dashboard/',
  discord: 'https://status.discord.com/',
  github: 'https://www.githubstatus.com/',
  facebook: 'https://metastatus.com/',
  twitch: 'https://status.twitch.tv/',
  steam: 'https://store.steampowered.com/stats/',
  epicGames: 'https://status.epicgames.com/',
  clerk: 'https://status.clerk.com/',
  cloudflare: 'https://www.cloudflarestatus.com/',
} as const;

export const StatusUrls = {
  production: {
    [FrontendService]: `https://${PrimaryDomain}`,
    [AuthService]: `https://${ApiDomain}/V1/services/auth${HealthRoute}`,
    [UserService]: `https://${ApiDomain}/V1/services/user${HealthRoute}`,
  },

  local: {
    [FrontendService]: `http://localhost:${FrontendPort}`,
    [AuthService]: `http://localhost:${AuthPort}${HealthRoute}`,
    [UserService]: `http://localhost:${UserPort}${HealthRoute}`,
  },
} as const;