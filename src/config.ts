import type { NavBarConfig } from "./types/config"

export const SITE_TITLE = "IMOKURING"
export const SITE_DESCRIPTION = "Personal website by Yoshio Sugiyama who is Applied AI Engineer / AI Platform Engineer"

export const navBarConfig: NavBarConfig = {
  links: [
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
}
