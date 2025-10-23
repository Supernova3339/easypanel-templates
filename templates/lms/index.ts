import { Output, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  services.push({
    type: "app",
    data: {
      serviceName: input.appServiceName,
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 5082,
        },
      ],
      mounts: [
        {
          type: "volume",
          name: "music",
          mountPath: "/music",
        },
        {
          type: "volume",
          name: "data",
          mountPath: "/var/lms",
        },
      ],
    },
  });

  return { services };
}
