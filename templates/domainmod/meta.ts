// Generated using "yarn build-templates"

export const meta = {
  name: "DomainMod",
  description:
    "DomainMOD is an open source application written in PHP used to manage your domains and other internet assets in a central location. DomainMOD also includes a Data Warehouse framework that allows you to import your web server data so that you can view, export, and report on your live data. Currently the Data Warehouse only supports servers running WHM/cPanel.",
  instructions: null,
  changeLog: [{ date: "2022-07-12", description: "first release" }],
  links: [
    { label: "Website", url: "https://domainmod.org/" },
    { label: "Documentation", url: "https://domainmod.org/docs/" },
    { label: "Github", url: "https://github.com/domainmod/domainmod/" },
  ],
  contributors: [
    { name: "Mark Topper", url: "https://github.com/marktopper" },
    { name: "Andrei Canta", url: "https://github.com/deiucanta" },
  ],
  schema: {
    type: "object",
    required: [
      "projectName",
      "domain",
      "appServiceName",
      "appServiceImage",
      "databaseServiceName",
      "timezone",
    ],
    properties: {
      projectName: { type: "string", title: "Project" },
      domain: { type: "string", title: "Domain" },
      appServiceName: {
        type: "string",
        title: "App Service Name",
        default: "domainmod",
      },
      appServiceImage: {
        type: "string",
        title: "App Service Image",
        default: "domainmod/domainmod",
      },
      databaseServiceName: {
        type: "string",
        title: "Database Service Name",
        default: "domainmod-db",
      },
      timezone: {
        type: "string",
        title: "Timezone",
        default: "Europe/Copenhagen",
      },
    },
  },
  logo: "logo.png",
  screenshots: ["screenshot.png"],
};

export type Project = string;
export type Domain = string;
export type AppServiceName = string;
export type AppServiceImage = string;
export type DatabaseServiceName = string;
export type Timezone = string;

export interface Input {
  projectName: Project;
  domain: Domain;
  appServiceName: AppServiceName;
  appServiceImage: AppServiceImage;
  databaseServiceName: DatabaseServiceName;
  timezone: Timezone;
}
