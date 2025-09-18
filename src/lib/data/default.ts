export interface Shortcut {
  name: string;
  url: string;
  icon: string;
}

export interface SearchEngine {
  name: string;
  url: string;
  suggestUrl: string;
  icon: string;
}

export const shortcuts: Shortcut[] = [
  {
    name: "YouTube",
    url: "https://youtube.com",
    icon: "https://www.youtube.com/s/desktop/9b55e232/img/favicon_144x144.png",
  },
  {
    name: "Yorishiro",
    url: "https://yorishiro.pages.dev",
    icon: "https://yorishiro.pages.dev/icons/icon.svg",
  },
  {
    name: "Reddit",
    url: "https://reddit.com",
    icon: "https://www.redditstatic.com/shreddit/assets/favicon/192x192.png",
  },
  {
    name: "AniList",
    url: "https://anilist.co/home",
    icon: "https://anilist.co/img/icons/apple-touch-icon.png",
  },
  {
    name: "Keep",
    url: "https://keep.google.com/u/1/#home",
    icon: "https://ssl.gstatic.com/keep/keep_2023q4.ico",
  },
  {
    name: "Email",
    url: "https://mail.proton.me/u/0/inbox",
    icon: "https://mail.proton.me/assets/favicon.ico",
  },
];

export const engines: SearchEngine[] = [
  {
    name: "Google",
    url: "https://google.com/search?q=",
    suggestUrl: "https://www.google.com/complete/search?client=chrome&q=",
    icon: "https://www.google.com/favicon.ico",
  },
  {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    suggestUrl: "https://duckduckgo.com/ac/?type=list&q=",
    icon: "https://duckduckgo.com/favicon.ico",
  },
  {
    name: "Bing",
    url: "https://bing.com/search?q=",
    suggestUrl: "https://www.bing.com/osjson.aspx?query=",
    icon: "https://www.bing.com/sa/simg/favicon-2x.ico",
  },
];
