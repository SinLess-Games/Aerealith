'use strict';
// libs/core/src/enumns/entities/profile/profile-link-platform.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileLinkPlatformValues =
  exports.DefaultProfileLinkPlatform =
  exports.ProfileLinkPlatform =
    void 0;
exports.isProfileLinkPlatform = isProfileLinkPlatform;
/**
 * Known external profile link platforms.
 */
exports.ProfileLinkPlatform = {
  Custom: 'custom',
  Other: 'other',
  // General links.
  Website: 'website',
  Portfolio: 'portfolio',
  Blog: 'blog',
  Linktree: 'linktree',
  Carrd: 'carrd',
  Beacons: 'beacons',
  AboutMe: 'about_me',
  // Contact.
  Email: 'email',
  Phone: 'phone',
  Sms: 'sms',
  // Developer.
  GitHub: 'github',
  GitLab: 'gitlab',
  Bitbucket: 'bitbucket',
  Codeberg: 'codeberg',
  SourceHut: 'sourcehut',
  StackOverflow: 'stackoverflow',
  DevTo: 'dev_to',
  Hashnode: 'hashnode',
  CodePen: 'codepen',
  Replit: 'replit',
  Glitch: 'glitch',
  Npm: 'npm',
  DockerHub: 'docker_hub',
  // Social.
  LinkedIn: 'linkedin',
  X: 'x',
  Twitter: 'twitter',
  Mastodon: 'mastodon',
  Bluesky: 'bluesky',
  Threads: 'threads',
  Facebook: 'facebook',
  Instagram: 'instagram',
  TikTok: 'tiktok',
  Snapchat: 'snapchat',
  Pinterest: 'pinterest',
  Tumblr: 'tumblr',
  Reddit: 'reddit',
  Quora: 'quora',
  Medium: 'medium',
  Substack: 'substack',
  // Chat.
  Discord: 'discord',
  Guilded: 'guilded',
  Slack: 'slack',
  Telegram: 'telegram',
  Signal: 'signal',
  WhatsApp: 'whatsapp',
  Matrix: 'matrix',
  Element: 'element',
  Skype: 'skype',
  // Video and streaming.
  YouTube: 'youtube',
  Twitch: 'twitch',
  Kick: 'kick',
  Vimeo: 'vimeo',
  Rumble: 'rumble',
  PeerTube: 'peertube',
  Trovo: 'trovo',
  // Music and podcasts.
  Spotify: 'spotify',
  AppleMusic: 'apple_music',
  SoundCloud: 'soundcloud',
  Bandcamp: 'bandcamp',
  Audius: 'audius',
  Deezer: 'deezer',
  Tidal: 'tidal',
  Podcast: 'podcast',
  ApplePodcasts: 'apple_podcasts',
  SpotifyPodcasts: 'spotify_podcasts',
  // Gaming.
  Steam: 'steam',
  EpicGames: 'epic_games',
  Xbox: 'xbox',
  PlayStation: 'playstation',
  Nintendo: 'nintendo',
  ItchIo: 'itch_io',
  GameJolt: 'game_jolt',
  Roblox: 'roblox',
  Minecraft: 'minecraft',
  BattleNet: 'battle_net',
  RiotGames: 'riot_games',
  Ubisoft: 'ubisoft',
  EA: 'ea',
  GOG: 'gog',
  // Creative.
  ArtStation: 'artstation',
  Behance: 'behance',
  Dribbble: 'dribbble',
  DeviantArt: 'deviantart',
  Pixiv: 'pixiv',
  Figma: 'figma',
  Canva: 'canva',
  Sketchfab: 'sketchfab',
  // Support and payments.
  Patreon: 'patreon',
  KoFi: 'ko_fi',
  BuyMeACoffee: 'buy_me_a_coffee',
  OpenCollective: 'open_collective',
  GitHubSponsors: 'github_sponsors',
  Liberapay: 'liberapay',
  PayPal: 'paypal',
  Venmo: 'venmo',
  CashApp: 'cash_app',
  Stripe: 'stripe',
  // Stores.
  Etsy: 'etsy',
  Shopify: 'shopify',
  Amazon: 'amazon',
  Ebay: 'ebay',
  Gumroad: 'gumroad',
  LemonSqueezy: 'lemon_squeezy',
  Fourthwall: 'fourthwall',
  Teespring: 'teespring',
  Redbubble: 'redbubble',
  Threadless: 'threadless',
  // Academic.
  GoogleScholar: 'google_scholar',
  ORCID: 'orcid',
  ResearchGate: 'researchgate',
  AcademiaEdu: 'academia_edu',
  Arxiv: 'arxiv',
  // Professional resources.
  Calendly: 'calendly',
  CalCom: 'cal_com',
  GoogleCalendar: 'google_calendar',
  Resume: 'resume',
  CV: 'cv',
  PressKit: 'press_kit',
  MediaKit: 'media_kit',
};
exports.DefaultProfileLinkPlatform = exports.ProfileLinkPlatform.Custom;
exports.ProfileLinkPlatformValues = Object.values(exports.ProfileLinkPlatform);
function isProfileLinkPlatform(value) {
  return (
    typeof value === 'string' &&
    exports.ProfileLinkPlatformValues.includes(value)
  );
}
//# sourceMappingURL=profile-link-platform.enum.js.map
