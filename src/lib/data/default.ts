export interface Shortcut {
  id: number;
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

export interface ColorValue {
  name: string;
  variable: string;
  value: string;
}

export type Theme = ColorValue[];

export const shortcuts: Shortcut[] = [
  {
    id: 0,
    name: "YouTube",
    url: "https://youtube.com",
    icon: "https://www.youtube.com/s/desktop/9b55e232/img/favicon_144x144.png",
  },
  {
    id: 1,
    name: "Yorishiro",
    url: "https://yorishiro.pages.dev",
    icon: "https://yorishiro.pages.dev/icons/icon.svg",
  },
  {
    id: 2,
    name: "Reddit",
    url: "https://reddit.com",
    icon: "https://www.redditstatic.com/shreddit/assets/favicon/192x192.png",
  },
  {
    id: 3,
    name: "AniList",
    url: "https://anilist.co/home",
    icon: "https://anilist.co/img/icons/apple-touch-icon.png",
  },
  {
    id: 4,
    name: "Keep",
    url: "https://keep.google.com/u/1/#home",
    icon: "https://ssl.gstatic.com/keep/keep_2023q4.ico",
  },
  {
    id: 5,
    name: "GitHub",
    url: "https://github.com/",
    icon: "https://github.githubassets.com/favicons/favicon-dark.svg",
  },
  {
    id: 6,
    name: "Photos",
    url: "https://photos.google.com/u/1/",
    icon: "https://www.gstatic.com/social/photosui/images/logo/1x/photos_512dp.png",
  },
  {
    id: 7,
    name: "Music",
    url: "https://music.youtube.com/",
    icon: "https://music.youtube.com/img/favicon_144.png",
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

export const theme: Theme = [
  {
    name: "Background",
    variable: "--background",
    value: "#0A0A0A",
  },
  {
    name: "Foreground",
    variable: "--foreground",
    value: "#FAFAFA",
  },
  {
    name: "Muted",
    variable: "--muted",
    value: "#262626",
  },
  {
    name: "Muted Foreground",
    variable: "--muted-foreground",
    value: "#A1A1A1",
  },
  {
    name: "Border",
    variable: "--border",
    value: "#ffffff26",
  },
  {
    name: "Accent",
    variable: "--accent",
    value: "#262626",
  },
];
