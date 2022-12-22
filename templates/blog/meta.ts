// Generated using "yarn build-templates"

export const meta = {
  name: "Blog",
  description:
    "This is a simple self-hosted, lightweight, singe-user PHP blog, where you can create your own Facebook-like feed. Give read access to other people, and you can share rich text with photos including highlighted code or links.",
  instructions: null,
  changeLog: [{ date: "2022-12-21", description: "first release" }],
  links: [{ label: "Github", url: "https://github.com/m1k1o/blog" }],
  contributors: [
    { name: "Supernova3339", url: "https://github.com/Supernova3339" },
  ],
  schema: {
    type: "object",
    required: [
      "projectName",
      "appServiceName",
      "appServiceImage",
      "blogTitle",
      "blogName",
      "blogNick",
      "blogPass",
    ],
    properties: {
      projectName: { type: "string", title: "Project Name" },
      appServiceName: {
        type: "string",
        title: "App Service Name",
        default: "blog",
      },
      appServiceImage: {
        type: "string",
        title: "App Service Image",
        default: "m1k1o/blog:latest",
      },
      blogTitle: { type: "string", title: "Blog Title" },
      blogName: { type: "string", title: "Blog Name" },
      blogNick: { type: "string", title: "Username" },
      blogPass: { type: "string", title: "Password" },
      blogLang: { type: "string", title: "Language", default: "EN" },
    },
  },
  logo: "logo.png",
  screenshots: ["screenshot.png"],
};

export type ProjectName = string;
export type AppServiceName = string;
export type AppServiceImage = string;
export type BlogTitle = string;
export type BlogName = string;
export type Username = string;
export type Password = string;
export type Language = string;

export interface Input {
  projectName: ProjectName;
  appServiceName: AppServiceName;
  appServiceImage: AppServiceImage;
  blogTitle: BlogTitle;
  blogName: BlogName;
  blogNick: Username;
  blogPass: Password;
  blogLang?: Language;
}
