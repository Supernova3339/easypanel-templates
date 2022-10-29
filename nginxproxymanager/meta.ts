// Generated using "yarn build-templates"

export const meta = {
  name: "Nginx Proxy Manager",
  description: "Expose your services easily and securely",
  instructions:
    "To login, please use the following credentials. user:admin@example.com password:changeme",
  changeLog: [{ date: "2022-10-28", description: "first release" }],
  links: [
    { label: "Website", url: "https://nginxproxymanager.com/" },
    { label: "Documentation", url: "https://nginxproxymanager.com/setup/" },
    { label: "Github", url: "https://github.com/jc21/nginx-proxy-manager" },
  ],
  contributors: [
    { name: "Supernova3339", url: "https://github.com/Supernova3339" },
  ],
  schema: {
    type: "object",
    required: ["projectName", "appServiceName", "appServiceImage"],
    properties: {
      projectName: { type: "string", title: "Project Name" },
      appServiceName: {
        type: "string",
        title: "App Service Name",
        default: "nginxproxymanager",
      },
      appServiceImage: {
        type: "string",
        title: "App Service Image",
        default: "jc21/nginxproxymanager:1.0",
      },
    },
  },
  logo: null,
  screenshots: [],
};

export type ProjectName = string;
export type AppServiceName = string;
export type AppServiceImage = string;

export interface Input {
  projectName: ProjectName;
  appServiceName: AppServiceName;
  appServiceImage: AppServiceImage;
}
