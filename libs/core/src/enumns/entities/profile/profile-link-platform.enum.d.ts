/**
 * Known external profile link platforms.
 */
export declare const ProfileLinkPlatform: {
  readonly Custom: 'custom';
  readonly Other: 'other';
  readonly Website: 'website';
  readonly Portfolio: 'portfolio';
  readonly Blog: 'blog';
  readonly Linktree: 'linktree';
  readonly Carrd: 'carrd';
  readonly Beacons: 'beacons';
  readonly AboutMe: 'about_me';
  readonly Email: 'email';
  readonly Phone: 'phone';
  readonly Sms: 'sms';
  readonly GitHub: 'github';
  readonly GitLab: 'gitlab';
  readonly Bitbucket: 'bitbucket';
  readonly Codeberg: 'codeberg';
  readonly SourceHut: 'sourcehut';
  readonly StackOverflow: 'stackoverflow';
  readonly DevTo: 'dev_to';
  readonly Hashnode: 'hashnode';
  readonly CodePen: 'codepen';
  readonly Replit: 'replit';
  readonly Glitch: 'glitch';
  readonly Npm: 'npm';
  readonly DockerHub: 'docker_hub';
  readonly LinkedIn: 'linkedin';
  readonly X: 'x';
  readonly Twitter: 'twitter';
  readonly Mastodon: 'mastodon';
  readonly Bluesky: 'bluesky';
  readonly Threads: 'threads';
  readonly Facebook: 'facebook';
  readonly Instagram: 'instagram';
  readonly TikTok: 'tiktok';
  readonly Snapchat: 'snapchat';
  readonly Pinterest: 'pinterest';
  readonly Tumblr: 'tumblr';
  readonly Reddit: 'reddit';
  readonly Quora: 'quora';
  readonly Medium: 'medium';
  readonly Substack: 'substack';
  readonly Discord: 'discord';
  readonly Guilded: 'guilded';
  readonly Slack: 'slack';
  readonly Telegram: 'telegram';
  readonly Signal: 'signal';
  readonly WhatsApp: 'whatsapp';
  readonly Matrix: 'matrix';
  readonly Element: 'element';
  readonly Skype: 'skype';
  readonly YouTube: 'youtube';
  readonly Twitch: 'twitch';
  readonly Kick: 'kick';
  readonly Vimeo: 'vimeo';
  readonly Rumble: 'rumble';
  readonly PeerTube: 'peertube';
  readonly Trovo: 'trovo';
  readonly Spotify: 'spotify';
  readonly AppleMusic: 'apple_music';
  readonly SoundCloud: 'soundcloud';
  readonly Bandcamp: 'bandcamp';
  readonly Audius: 'audius';
  readonly Deezer: 'deezer';
  readonly Tidal: 'tidal';
  readonly Podcast: 'podcast';
  readonly ApplePodcasts: 'apple_podcasts';
  readonly SpotifyPodcasts: 'spotify_podcasts';
  readonly Steam: 'steam';
  readonly EpicGames: 'epic_games';
  readonly Xbox: 'xbox';
  readonly PlayStation: 'playstation';
  readonly Nintendo: 'nintendo';
  readonly ItchIo: 'itch_io';
  readonly GameJolt: 'game_jolt';
  readonly Roblox: 'roblox';
  readonly Minecraft: 'minecraft';
  readonly BattleNet: 'battle_net';
  readonly RiotGames: 'riot_games';
  readonly Ubisoft: 'ubisoft';
  readonly EA: 'ea';
  readonly GOG: 'gog';
  readonly ArtStation: 'artstation';
  readonly Behance: 'behance';
  readonly Dribbble: 'dribbble';
  readonly DeviantArt: 'deviantart';
  readonly Pixiv: 'pixiv';
  readonly Figma: 'figma';
  readonly Canva: 'canva';
  readonly Sketchfab: 'sketchfab';
  readonly Patreon: 'patreon';
  readonly KoFi: 'ko_fi';
  readonly BuyMeACoffee: 'buy_me_a_coffee';
  readonly OpenCollective: 'open_collective';
  readonly GitHubSponsors: 'github_sponsors';
  readonly Liberapay: 'liberapay';
  readonly PayPal: 'paypal';
  readonly Venmo: 'venmo';
  readonly CashApp: 'cash_app';
  readonly Stripe: 'stripe';
  readonly Etsy: 'etsy';
  readonly Shopify: 'shopify';
  readonly Amazon: 'amazon';
  readonly Ebay: 'ebay';
  readonly Gumroad: 'gumroad';
  readonly LemonSqueezy: 'lemon_squeezy';
  readonly Fourthwall: 'fourthwall';
  readonly Teespring: 'teespring';
  readonly Redbubble: 'redbubble';
  readonly Threadless: 'threadless';
  readonly GoogleScholar: 'google_scholar';
  readonly ORCID: 'orcid';
  readonly ResearchGate: 'researchgate';
  readonly AcademiaEdu: 'academia_edu';
  readonly Arxiv: 'arxiv';
  readonly Calendly: 'calendly';
  readonly CalCom: 'cal_com';
  readonly GoogleCalendar: 'google_calendar';
  readonly Resume: 'resume';
  readonly CV: 'cv';
  readonly PressKit: 'press_kit';
  readonly MediaKit: 'media_kit';
};
export type ProfileLinkPlatform =
  (typeof ProfileLinkPlatform)[keyof typeof ProfileLinkPlatform];
export declare const DefaultProfileLinkPlatform: 'custom';
export declare const ProfileLinkPlatformValues: (
  | 'sms'
  | 'other'
  | 'custom'
  | 'website'
  | 'portfolio'
  | 'blog'
  | 'linktree'
  | 'carrd'
  | 'beacons'
  | 'about_me'
  | 'email'
  | 'phone'
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'codeberg'
  | 'sourcehut'
  | 'stackoverflow'
  | 'dev_to'
  | 'hashnode'
  | 'codepen'
  | 'replit'
  | 'glitch'
  | 'npm'
  | 'docker_hub'
  | 'linkedin'
  | 'x'
  | 'twitter'
  | 'mastodon'
  | 'bluesky'
  | 'threads'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'snapchat'
  | 'pinterest'
  | 'tumblr'
  | 'reddit'
  | 'quora'
  | 'medium'
  | 'substack'
  | 'discord'
  | 'guilded'
  | 'slack'
  | 'telegram'
  | 'signal'
  | 'whatsapp'
  | 'matrix'
  | 'element'
  | 'skype'
  | 'youtube'
  | 'twitch'
  | 'kick'
  | 'vimeo'
  | 'rumble'
  | 'peertube'
  | 'trovo'
  | 'spotify'
  | 'apple_music'
  | 'soundcloud'
  | 'bandcamp'
  | 'audius'
  | 'deezer'
  | 'tidal'
  | 'podcast'
  | 'apple_podcasts'
  | 'spotify_podcasts'
  | 'steam'
  | 'epic_games'
  | 'xbox'
  | 'playstation'
  | 'nintendo'
  | 'itch_io'
  | 'game_jolt'
  | 'roblox'
  | 'minecraft'
  | 'battle_net'
  | 'riot_games'
  | 'ubisoft'
  | 'ea'
  | 'gog'
  | 'artstation'
  | 'behance'
  | 'dribbble'
  | 'deviantart'
  | 'pixiv'
  | 'figma'
  | 'canva'
  | 'sketchfab'
  | 'patreon'
  | 'ko_fi'
  | 'buy_me_a_coffee'
  | 'open_collective'
  | 'github_sponsors'
  | 'liberapay'
  | 'paypal'
  | 'venmo'
  | 'cash_app'
  | 'stripe'
  | 'etsy'
  | 'shopify'
  | 'amazon'
  | 'ebay'
  | 'gumroad'
  | 'lemon_squeezy'
  | 'fourthwall'
  | 'teespring'
  | 'redbubble'
  | 'threadless'
  | 'google_scholar'
  | 'orcid'
  | 'researchgate'
  | 'academia_edu'
  | 'arxiv'
  | 'calendly'
  | 'cal_com'
  | 'google_calendar'
  | 'resume'
  | 'cv'
  | 'press_kit'
  | 'media_kit'
)[];
export declare function isProfileLinkPlatform(
  value: unknown,
): value is ProfileLinkPlatform;
