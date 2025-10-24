#!/usr/bin/env ts-node
/**
 * Docker Compose to Easypanel Template Converter
 *
 * Converts docker-compose.yml files into Easypanel templates.
 *
 * Usage:
 *   npm run compose-to-template -- <path-to-docker-compose.yml> <template-slug>
 *
 * Example:
 *   npm run compose-to-template -- ./docker-compose.yml myapp
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import axios from 'axios';

interface DockerComposeService {
  image?: string;
  build?: string | { context: string; dockerfile?: string };
  command?: string | string[];
  environment?: Record<string, string> | string[];
  ports?: string[];
  volumes?: string[];
  depends_on?: string[] | Record<string, any>;
  restart?: string;
  networks?: string[] | Record<string, any>;
  labels?: Record<string, string>;
  env_file?: string | string[];
  [key: string]: any;
}

interface DockerCompose {
  version?: string;
  services: Record<string, DockerComposeService>;
  volumes?: Record<string, any>;
  networks?: Record<string, any>;
}

class ComposeToTemplateConverter {
  private isUrl(path: string): boolean {
    return path.startsWith('http://') || path.startsWith('https://');
  }

  private sanitizeVarName(name: string): string {
    // Convert hyphens to underscores for valid JavaScript variable names
    return name.replace(/-/g, '_');
  }

  async convert(composePath: string, templateSlug: string) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Docker Compose to Easypanel Template Converter          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Validate inputs
    if (!templateSlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Template slug must contain only lowercase letters, numbers, and hyphens');
    }

    const templatePath = path.join(__dirname, '..', 'templates', templateSlug);
    if (await fs.pathExists(templatePath)) {
      throw new Error(`Template "${templateSlug}" already exists!`);
    }

    // Read docker-compose file (from URL or local file)
    let composeContent: string;

    if (this.isUrl(composePath)) {
      console.log(`Fetching from URL: ${composePath}`);
      try {
        const response = await axios.get(composePath, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Easypanel-Template-Converter/1.0',
          },
        });
        composeContent = response.data;
        if (typeof composeContent !== 'string') {
          composeContent = yaml.stringify(composeContent);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch from URL: ${error.message}`);
        }
        throw error;
      }
    } else {
      console.log(`Reading: ${composePath}`);
      composeContent = await fs.readFile(composePath, 'utf-8');
    }

    const compose: DockerCompose = yaml.parse(composeContent);

    if (!compose.services || Object.keys(compose.services).length === 0) {
      throw new Error('No services found in docker-compose file');
    }

    console.log(`Found ${Object.keys(compose.services).length} services\n`);

    // Detect database services
    const analysis = this.analyzeServices(compose.services);
    console.log('Analysis:');
    console.log(`  - ${analysis.databases.length} database service(s)`);
    console.log(`  - ${analysis.apps.length} application service(s)`);
    console.log(`  - ${analysis.otherServices.length} other service(s)\n`);

    // Generate template
    await this.generateTemplate(templateSlug, compose, analysis);

    console.log('✅ Template created successfully!\n');
    console.log(`Location: templates/${templateSlug}/\n`);
    console.log('Next steps:');
    console.log(`  1. Review generated files in templates/${templateSlug}/`);
    console.log(`  2. Add logo: templates/${templateSlug}/assets/logo.png`);
    console.log(`  3. Add screenshot: templates/${templateSlug}/assets/screenshot.png`);
    console.log(`  4. Customize meta.yaml (name, description, etc.)`);
    console.log(`  5. Review and adjust index.ts`);
    console.log(`  6. Test: npm run dev`);
    console.log(`  7. Build: npm run build-templates\n`);
    console.log('⚠️  Note: Please review the generated template carefully.');
    console.log('    Some features may need manual adjustment.\n');
  }

  private analyzeServices(services: Record<string, DockerComposeService>) {
    const databases: string[] = [];
    const apps: string[] = [];
    const otherServices: string[] = [];

    const dbImages = ['postgres', 'mysql', 'mariadb', 'mongo', 'redis', 'elasticsearch'];

    for (const [name, service] of Object.entries(services)) {
      const image = service.image?.toLowerCase() || '';
      const isDb = dbImages.some((db) => image.includes(db) || name.toLowerCase().includes(db));

      if (isDb) {
        databases.push(name);
      } else if (service.image || service.build) {
        apps.push(name);
      } else {
        otherServices.push(name);
      }
    }

    return { databases, apps, otherServices };
  }

  private async generateTemplate(
    slug: string,
    compose: DockerCompose,
    analysis: { databases: string[]; apps: string[]; otherServices: string[] }
  ) {
    const templatePath = path.join(__dirname, '..', 'templates', slug);
    await fs.ensureDir(path.join(templatePath, 'assets'));

    // Generate meta.yaml
    const metaYaml = this.generateMetaYaml(slug, compose, analysis);
    await fs.writeFile(path.join(templatePath, 'meta.yaml'), metaYaml);

    // Generate index.ts
    const indexTs = this.generateIndexTs(slug, compose, analysis);
    await fs.writeFile(path.join(templatePath, 'index.ts'), indexTs);

    // Create placeholder assets
    await fs.writeFile(
      path.join(templatePath, 'assets', 'logo.png.placeholder'),
      'Add logo.png or logo.svg here (512x512px recommended)'
    );
    await fs.writeFile(
      path.join(templatePath, 'assets', 'screenshot.png.placeholder'),
      'Add screenshot.png here (1200x630px recommended)'
    );

    // Create README with conversion notes
    const readme = this.generateReadme(slug, compose, analysis);
    await fs.writeFile(path.join(templatePath, 'CONVERSION_NOTES.md'), readme);
  }

  private generateMetaYaml(
    slug: string,
    compose: DockerCompose,
    analysis: { databases: string[]; apps: string[]; otherServices: string[] }
  ): string {
    const schema: any = {
      type: 'object',
      required: ['projectName'],
      properties: {
        projectName: {
          type: 'string',
          title: 'Project Name',
        },
      },
    };

    // Add fields for each service
    const allServices = [...analysis.databases, ...analysis.apps, ...analysis.otherServices];
    for (const serviceName of allServices) {
      const service = compose.services[serviceName];
      const fieldName = `${serviceName}ServiceName`;

      schema.properties[fieldName] = {
        type: 'string',
        title: `${serviceName} Service Name`,
        default: serviceName,
      };
      schema.required.push(fieldName);

      // Add image field
      if (service.image) {
        const imageField = `${serviceName}ServiceImage`;
        schema.properties[imageField] = {
          type: 'string',
          title: `${serviceName} Docker Image`,
          default: service.image,
        };
        schema.required.push(imageField);
      }

      // Add environment variables as fields
      if (service.environment) {
        const envVars = this.parseEnvironment(service.environment);
        for (const [key, value] of Object.entries(envVars)) {
          const envFieldName = `${serviceName}_${key}`;
          schema.properties[envFieldName] = {
            type: 'string',
            title: `${serviceName}: ${key}`,
            default: String(value),
          };
        }
      }
    }

    const meta = {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      description: `Converted from docker-compose.yml with ${allServices.length} service(s)`,
      instructions: 'This template was auto-generated from a docker-compose file. Please review and customize.',
      changeLog: [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Initial conversion from docker-compose',
        },
      ],
      links: [],
      contributors: [
        {
          name: 'Converted with Easypanel Tools',
          url: 'https://easypanel.io',
        },
      ],
      schema,
    };

    return yaml.stringify(meta);
  }

  private generateIndexTs(
    slug: string,
    compose: DockerCompose,
    analysis: { databases: string[]; apps: string[]; otherServices: string[] }
  ): string {
    let code = `import { Output, randomPassword, Services } from "~templates-utils";\nimport { Input } from "./meta";\n\n`;
    code += `export function generate(input: Input): Output {\n`;
    code += `  const services: Services = [];\n\n`;

    // Generate passwords for databases
    const dbPasswords: Record<string, string> = {};
    for (const dbName of analysis.databases) {
      const varName = `${this.sanitizeVarName(dbName)}Password`;
      dbPasswords[dbName] = varName;
      code += `  const ${varName} = randomPassword();\n`;
    }

    if (analysis.databases.length > 0) {
      code += `\n`;
    }

    // Generate database services
    for (const dbName of analysis.databases) {
      const service = compose.services[dbName];
      const dbType = this.detectDatabaseType(service.image || '');

      code += `  // ${dbName} Service (${dbType || 'database'})\n`;

      if (dbType && ['postgres', 'mysql', 'mariadb', 'mongo', 'redis'].includes(dbType)) {
        code += `  services.push({\n`;
        code += `    type: "${dbType}",\n`;
        code += `    data: {\n`;
        code += `      serviceName: input.${dbName}ServiceName,\n`;
        code += `      password: ${dbPasswords[dbName]},\n`;
        code += `    },\n`;
        code += `  });\n\n`;
      } else {
        // Use app service for unsupported databases
        code += this.generateAppServiceCode(dbName, service, dbPasswords);
      }
    }

    // Generate app services
    for (const appName of analysis.apps) {
      const service = compose.services[appName];
      code += this.generateAppServiceCode(appName, service, dbPasswords);
    }

    // Generate other services
    for (const serviceName of analysis.otherServices) {
      const service = compose.services[serviceName];
      code += this.generateAppServiceCode(serviceName, service, dbPasswords);
    }

    code += `  return { services };\n`;
    code += `}\n`;

    return code;
  }

  private generateAppServiceCode(
    serviceName: string,
    service: DockerComposeService,
    dbPasswords: Record<string, string>
  ): string {
    let code = `  // ${serviceName} Service\n`;
    code += `  services.push({\n`;
    code += `    type: "app",\n`;
    code += `    data: {\n`;
    code += `      serviceName: input.${serviceName}ServiceName,\n`;

    // Environment variables
    const envVars = this.parseEnvironment(service.environment || {});
    if (Object.keys(envVars).length > 0) {
      code += `      env: [\n`;
      for (const [key, value] of Object.entries(envVars)) {
        const interpolatedValue = this.interpolateEnvValue(value, dbPasswords);
        code += `        \`${key}=${interpolatedValue}\`,\n`;
      }
      code += `      ].join("\\n"),\n`;
    }

    // Source
    if (service.image) {
      code += `      source: {\n`;
      code += `        type: "image",\n`;
      code += `        image: input.${serviceName}ServiceImage,\n`;
      code += `      },\n`;
    } else if (service.build) {
      code += `      // TODO: Configure build source\n`;
      code += `      source: {\n`;
      code += `        type: "image",\n`;
      code += `        image: "REPLACE_WITH_IMAGE",\n`;
      code += `      },\n`;
    }

    // Volumes
    if (service.volumes && service.volumes.length > 0) {
      code += `      mounts: [\n`;
      for (const volume of service.volumes) {
        const parsed = this.parseVolume(volume);
        if (parsed.type === 'volume') {
          code += `        {\n`;
          code += `          type: "volume",\n`;
          code += `          name: "${parsed.name}",\n`;
          code += `          mountPath: "${parsed.containerPath}",\n`;
          code += `        },\n`;
        } else if (parsed.type === 'bind') {
          code += `        // TODO: Handle bind mount: ${volume}\n`;
        }
      }
      code += `      ],\n`;
    }

    // Ports / Domains
    if (service.ports && service.ports.length > 0) {
      const firstPort = this.parsePort(service.ports[0]);
      if (firstPort) {
        code += `      domains: [\n`;
        code += `        {\n`;
        code += `          host: "$(EASYPANEL_DOMAIN)",\n`;
        code += `          port: ${firstPort.containerPort},\n`;
        code += `        },\n`;
        code += `      ],\n`;
      }
    }

    // Command
    if (service.command) {
      const command = Array.isArray(service.command) ? service.command.join(' ') : service.command;
      // Escape quotes in command
      const escapedCommand = command.replace(/"/g, '\\"');
      code += `      deploy: {\n`;
      code += `        command: "${escapedCommand}",\n`;
      code += `      },\n`;
    }

    code += `    },\n`;
    code += `  });\n\n`;

    return code;
  }

  private parseEnvironment(env: Record<string, string> | string[]): Record<string, string> {
    if (Array.isArray(env)) {
      const result: Record<string, string> = {};
      for (const item of env) {
        const [key, ...valueParts] = item.split('=');
        result[key] = valueParts.join('=') || '';
      }
      return result;
    }
    return env;
  }

  private interpolateEnvValue(value: string | number | boolean, dbPasswords: Record<string, string>): string {
    // Convert to string if not already
    let strValue = String(value);

    // Replace database password references
    for (const [dbName, passwordVar] of Object.entries(dbPasswords)) {
      // Look for patterns like "postgres://user:password@db:5432"
      strValue = strValue.replace(new RegExp(dbName, 'g'), `$(PROJECT_NAME)_\${input.${dbName}ServiceName}`);
    }

    // Escape template literals
    strValue = strValue.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    return strValue;
  }

  private parseVolume(volume: string): {
    type: 'volume' | 'bind';
    name: string;
    containerPath: string;
    hostPath?: string;
  } {
    const parts = volume.split(':');
    if (parts.length >= 2) {
      const source = parts[0];
      const target = parts[1];

      if (source.startsWith('/') || source.startsWith('./')) {
        return {
          type: 'bind',
          name: source,
          hostPath: source,
          containerPath: target,
        };
      } else {
        return {
          type: 'volume',
          name: source,
          containerPath: target,
        };
      }
    }

    return {
      type: 'volume',
      name: 'unknown',
      containerPath: volume,
    };
  }

  private parsePort(port: string): { hostPort: number; containerPort: number } | null {
    const parts = port.split(':');
    if (parts.length === 2) {
      return {
        hostPort: parseInt(parts[0], 10),
        containerPort: parseInt(parts[1], 10),
      };
    } else if (parts.length === 1) {
      const p = parseInt(parts[0], 10);
      return { hostPort: p, containerPort: p };
    }
    return null;
  }

  private detectDatabaseType(image: string): string | null {
    const lower = image.toLowerCase();
    if (lower.includes('postgres')) return 'postgres';
    if (lower.includes('mysql')) return 'mysql';
    if (lower.includes('mariadb')) return 'mariadb';
    if (lower.includes('mongo')) return 'mongo';
    if (lower.includes('redis')) return 'redis';
    return null;
  }

  private generateReadme(
    slug: string,
    compose: DockerCompose,
    analysis: { databases: string[]; apps: string[]; otherServices: string[] }
  ): string {
    let readme = `# ${slug} - Conversion Notes\n\n`;
    readme += `This template was automatically converted from a docker-compose.yml file.\n\n`;
    readme += `## Services Detected\n\n`;
    readme += `### Databases (${analysis.databases.length})\n`;
    for (const db of analysis.databases) {
      readme += `- ${db}\n`;
    }
    readme += `\n### Applications (${analysis.apps.length})\n`;
    for (const app of analysis.apps) {
      readme += `- ${app}\n`;
    }
    readme += `\n### Other Services (${analysis.otherServices.length})\n`;
    for (const svc of analysis.otherServices) {
      readme += `- ${svc}\n`;
    }

    readme += `\n## Manual Review Required\n\n`;
    readme += `Please review the following:\n\n`;
    readme += `1. **Environment Variables**: Check that all env vars are correctly mapped\n`;
    readme += `2. **Volumes**: Verify volume mounts are correct\n`;
    readme += `3. **Build Contexts**: Services with 'build' need manual configuration\n`;
    readme += `4. **Networks**: Docker Compose networks are not directly supported\n`;
    readme += `5. **Dependencies**: Service dependencies may need adjustment\n`;
    readme += `6. **Secrets**: Ensure sensitive values use randomPassword() or user input\n`;
    readme += `7. **Ports**: Verify port mappings match your application\n\n`;

    readme += `## Original docker-compose.yml Summary\n\n`;
    readme += `\`\`\`yaml\n`;
    readme += yaml.stringify(compose, { indent: 2 }).substring(0, 1000);
    readme += `\n...\n\`\`\`\n`;

    return readme;
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Docker Compose to Easypanel Template Converter

Usage:
  npm run compose-to-template -- <path-or-url> <template-slug>

Arguments:
  path-or-url       Path to docker-compose.yml file OR URL to fetch from
  template-slug     Slug for the new template (lowercase, e.g., myapp)

Examples:
  # Local file
  npm run compose-to-template -- ./docker-compose.yml myapp
  npm run compose-to-template -- ~/projects/myapp/docker-compose.yml myapp

  # From URL
  npm run compose-to-template -- https://raw.githubusercontent.com/user/repo/main/docker-compose.yml myapp
  npm run compose-to-template -- https://example.com/docker-compose.yml myapp

Options:
  --help, -h        Show this help message

The converter will:
  - Analyze your docker-compose.yml file
  - Detect databases and applications
  - Generate meta.yaml with appropriate schema
  - Generate index.ts with service configurations
  - Create CONVERSION_NOTES.md with review items
`);
    process.exit(0);
  }

  const [composePath, slug] = args;

  try {
    const converter = new ComposeToTemplateConverter();
    await converter.convert(composePath, slug);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default ComposeToTemplateConverter;
