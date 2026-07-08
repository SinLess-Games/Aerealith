export declare const ThirdPartyStatusUrls: {
  readonly google: 'https://www.google.com/appsstatus/dashboard/';
  readonly discord: 'https://status.discord.com/';
  readonly github: 'https://www.githubstatus.com/';
  readonly facebook: 'https://metastatus.com/';
  readonly twitch: 'https://status.twitch.tv/';
  readonly steam: 'https://store.steampowered.com/stats/';
  readonly epicGames: 'https://status.epicgames.com/';
  readonly clerk: 'https://status.clerk.com/';
  readonly cloudflare: 'https://www.cloudflarestatus.com/';
};
export declare const StatusUrls: {
  readonly production: {
    readonly frontend: 'https://aerealith.com';
    readonly auth: 'https://api.aerealith.com/V1/services/auth/health';
    readonly user: 'https://api.aerealith.com/V1/services/user/health';
  };
  readonly local: {
    readonly frontend: 'http://localhost:3000';
    readonly auth: 'http://localhost:8787/health';
    readonly user: 'http://localhost:8788/health';
  };
};
