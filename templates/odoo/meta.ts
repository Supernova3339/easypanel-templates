// Generated using "yarn build-templates"

export const meta = {
  name: "odoo",
  description:
    "Odoo, formerly known as OpenERP, is a suite of open-source business apps written in Python and released under the LGPL license.",
  instructions: 'You can login with username "admin" and password "umami".',
  changeLog: [{ date: 2023, description: "first release" }],
  links: [
    { label: "Website", url: "https://www.odoo.com" },
    { label: "Github", url: "https://github.com/odoo/odoo" },
    { label: "Documentation", url: "https://www.odoo.com/page/docs" },
  ],
  contributors: [{ name: "DrMxrcy", url: "https://github.com/DrMxrcy" }],
  schema: {
    type: "object",
    required: [
      "projectName",
      "appServiceName",
      "appServiceImage",
      "databaseServiceName",
    ],
    properties: {
      projectName: { type: "string", title: "Project Name" },
      appServiceName: {
        type: "string",
        title: "App Service Name",
        default: "odoo",
      },
      appServiceImage: {
        type: "string",
        title: "App Service Image",
        default: "odoo:16.0",
      },
      databaseServiceName: {
        type: "string",
        title: "Database Service Name",
        default: "odoo-db",
      },
    },
  },
  logo: "logo.png",
  screenshots: ["screenshot.png"],
};

export type ProjectName = string;
export type AppServiceName = string;
export type AppServiceImage = string;
export type DatabaseServiceName = string;

export interface Input {
  projectName: ProjectName;
  appServiceName: AppServiceName;
  appServiceImage: AppServiceImage;
  databaseServiceName: DatabaseServiceName;
}
