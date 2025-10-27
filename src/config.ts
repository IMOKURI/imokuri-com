import type { Links } from "./types/config"

export const SITE_TITLE = "IMOKURING"
export const SITE_DESCRIPTION = "Personal website by Yoshio Sugiyama who is Applied AI Engineer / AI Platform Engineer"

export const navBarLinks: Links = [
  {
    name: "About",
    url: "/about",
    icon: "fa-user"
  },
  {
    name: "Blog",
    url: "/blog",
    icon: "fa-pencil"
  },
  {
    name: "Activity",
    url: "/activity",
    icon: "fa-code"
  }
]

export const socialLinks: Links = [
  {
    name: "GitHub",
    url: "https://github.com/IMOKURI",
    icon: "fa-github"
  },
  {
    name: "Bluesky",
    url: "https://bsky.app/profile/imokuri.com",
    icon: "fa-bluesky"
  },
  {
    name: "X (旧Twitter)",
    url: "https://x.com/imokurity",
    icon: "fa-x-twitter"
  },
  {
    name: "Kaggle",
    url: "https://kaggle.com/imokuri",
    icon: "fa-kaggle"
  }
]
