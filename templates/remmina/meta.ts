// Generated using "yarn build-templates"

export const meta = {
  name: "Remmina",
  description:
    "Remmina is a remote desktop client written in GTK, aiming to be useful for system administrators and travellers, who need to work with lots of remote computers in front of either large or tiny screens. Remmina supports multiple network protocols, in an integrated and consistent user interface. Currently RDP, VNC, SPICE, NX, XDMCP, SSH and EXEC are supported.",
  instructions:
    "use abc:abc to login. To access the login interface, add ?login=true to your URL.",
  changeLog: [{ date: "2022-11-15", description: "first release" }],
  links: [
    {
      label: "Documentation",
      url: "https://docs.linuxserver.io/images/docker-remmina",
    },
    { label: "Github", url: "https://github.com/linuxserver/docker-remmina" },
    { label: "Website", url: "https://remmina.org" },
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
        default: "remmina",
      },
      appServiceImage: {
        type: "string",
        title: "App Service Image",
        default: "lscr.io/linuxserver/remmina:latest",
      },
    },
  },
  logo: "logo.png",
  screenshots: ["screenshot.png"],
};

export type ProjectName = string;
export type AppServiceName = string;
export type AppServiceImage = string;

export interface Input {
  projectName: ProjectName;
  appServiceName: AppServiceName;
  appServiceImage: AppServiceImage;
}
