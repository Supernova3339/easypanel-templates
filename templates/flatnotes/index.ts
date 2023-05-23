import { Output, randomString, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];
  const appkey = randomString(32);

  services.push({
    type: "app",
    data: {
      projectName: input.projectName,
      serviceName: input.appServiceName,
      env: [
        `PUID=1000`,
        `GUID=1000`,
        `FLATNOTES_AUTH_TYPE=password`,
        `FLATNOTES_USERNAME=${input.username}`,
        `FLATNOTES_PASSWORD=${input.password}`,
        `FLATNOTES_SECRET_KEY=${appkey}`,
      ].join("\n"),
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      proxy: {
        port: 80,
        secure: true,
      },
      mounts: [
        {
          type: "volume",
          name: "data",
          mountPath: "/data",
        }
      ],
    },
  });

  return { services };
}
