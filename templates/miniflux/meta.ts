// Generated using "yarn build-templates"

export const meta = {
  name: "Miniflux",
  description:
    "Miniflux is a minimalist and opinionated feed reader written in GO.Supports multiple enclosures/attachments (Podcasts, videos, music, and images).Save articles to third-party services.Play videos from YouTube channels directly inside Miniflux.Send articles to Telegram, Pinboard, Instapaper, Pocket, Wallabag, Linkding, Espial, or Nunux Keeper",
  instructions: null,
  changeLog: [{ date: "2022-07-12", description: "first release" }],
  links: [
    { label: "Website", url: "https://miniflux.app/" },
    { label: "Documentation", url: "https://miniflux.app/docs/" },
    { label: "Github", url: "https://github.com/miniflux" },
  ],
  contributors: [
    { name: "Ponkhy", url: "https://github.com/Ponkhy" },
    { name: "Andrei Canta", url: "https://github.com/deiucanta" },
  ],
  schema: {
    type: "object",
    required: [
      "projectName",
      "adminUsername",
      "adminPassword",
      "appServiceName",
      "appServiceImage",
      "databaseServiceName",
    ],
    properties: {
      projectName: { type: "string", title: "Project Name" },
      adminUsername: { type: "string", title: "Admin Username" },
      adminPassword: { type: "string", title: "Admin Password" },
      appServiceName: {
        type: "string",
        title: "App Service Name",
        default: "miniflux",
      },
      appServiceImage: {
        type: "string",
        title: "App Service Image",
        default: "miniflux/miniflux:2.0.38",
      },
      databaseServiceName: {
        type: "string",
        title: "Database Service Name",
        default: "miniflux-db",
      },
    },
  },
  logo: "logo.png",
  screenshots: ["screenshot.png"],
};

export type ProjectName = string;
export type AdminUsername = string;
export type AdminPassword = string;
export type AppServiceName = string;
export type AppServiceImage = string;
export type DatabaseServiceName = string;

export interface Input {
  projectName: ProjectName;
  adminUsername: AdminUsername;
  adminPassword: AdminPassword;
  appServiceName: AppServiceName;
  appServiceImage: AppServiceImage;
  databaseServiceName: DatabaseServiceName;
}
