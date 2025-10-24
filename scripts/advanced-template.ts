#!/usr/bin/env ts-node
/**
 * Advanced Template Creator
 *
 * For complex templates with:
 * - Multiple app services
 * - Mounted configuration files
 * - Complex service configurations
 *
 * Usage:
 *   npm run advanced-template
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';
import * as yaml from 'yaml';

interface ServiceConfig {
  name: string;
  type: 'app' | 'postgres' | 'mysql' | 'mongo' | 'redis' | 'mariadb';
  image?: string;
  command?: string;
  port?: number;
  mountedFiles?: Array<{
    filename: string;
    mountPath: string;
    content: string;
  }>;
}

interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  website?: string;
  services: ServiceConfig[];
  globalEnvVars?: Array<{
    name: string;
    title: string;
    default?: string;
    type: 'string' | 'boolean' | 'number';
  }>;
}

class AdvancedTemplateCreator {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  async run() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Advanced Template Creator - Complex Multi-Service        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
      const config = await this.collectInput();
      await this.generateTemplate(config);
      console.log('\n✅ Advanced template created successfully!');
      console.log(`\nNext steps:`);
      console.log(`1. Add logo: templates/${config.slug}/assets/logo.png`);
      console.log(`2. Add screenshot: templates/${config.slug}/assets/screenshot.png`);
      console.log(`3. Review: templates/${config.slug}/meta.yaml`);
      console.log(`4. Review: templates/${config.slug}/index.ts`);
      console.log(`5. Test: npm run dev`);
      console.log(`6. Build: npm run build-templates\n`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  private async collectInput(): Promise<TemplateConfig> {
    // Basic info
    const slug = await this.question('Template slug (lowercase, e.g., myapp): ');
    if (!slug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    const templatePath = path.join(__dirname, '..', 'templates', slug);
    if (await fs.pathExists(templatePath)) {
      throw new Error(`Template "${slug}" already exists!`);
    }

    const name = await this.question('Template name (e.g., My App): ');
    const description = await this.question('Short description: ');
    const website = await this.question('Website URL (optional): ');

    // Collect services
    console.log('\n=== Service Configuration ===');
    console.log('Add all services for this template (databases, apps, workers, etc.)\n');

    const services: ServiceConfig[] = [];

    while (true) {
      const serviceName = await this.question(`\nService name (or press Enter if done): `);
      if (!serviceName.trim()) break;

      console.log('\nService types:');
      console.log('1. app (application container)');
      console.log('2. postgres');
      console.log('3. mysql');
      console.log('4. mongo');
      console.log('5. redis');
      console.log('6. mariadb');

      const typeChoice = await this.question('Choose type (1-6): ');
      const types = ['app', 'postgres', 'mysql', 'mongo', 'redis', 'mariadb'] as const;
      const type = types[parseInt(typeChoice, 10) - 1] || 'app';

      const service: ServiceConfig = {
        name: serviceName,
        type,
      };

      if (type === 'app') {
        service.image = await this.question('  Docker image: ');
        const portStr = await this.question('  Port (optional, press Enter to skip): ');
        if (portStr) {
          service.port = parseInt(portStr, 10);
        }
        const command = await this.question('  Custom command (optional): ');
        if (command) {
          service.command = command;
        }

        // Ask about mounted files
        const hasFiles = await this.question('  Add mounted config files? (y/n): ');
        if (hasFiles.toLowerCase() === 'y') {
          service.mountedFiles = [];
          while (true) {
            const filename = await this.question('    Filename (or Enter to finish): ');
            if (!filename.trim()) break;

            const mountPath = await this.question('    Mount path in container: ');
            console.log('    File content (end with a line containing only "END"):');

            const contentLines: string[] = [];
            const rlForContent = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
              terminal: false,
            });

            await new Promise<void>((resolve) => {
              rlForContent.on('line', (line) => {
                if (line === 'END') {
                  rlForContent.close();
                  resolve();
                } else {
                  contentLines.push(line);
                }
              });
            });

            service.mountedFiles.push({
              filename,
              mountPath,
              content: contentLines.join('\n'),
            });
          }
        }
      }

      services.push(service);
      console.log(`✓ Added ${type} service: ${serviceName}`);
    }

    if (services.length === 0) {
      throw new Error('At least one service is required');
    }

    // Global environment variables
    console.log('\n=== Global Environment Variables ===');
    const addGlobalEnv = await this.question('Add global env vars? (y/n): ');
    const globalEnvVars: TemplateConfig['globalEnvVars'] = [];

    if (addGlobalEnv.toLowerCase() === 'y') {
      while (true) {
        const envName = await this.question('  Env var name (or Enter to finish): ');
        if (!envName.trim()) break;

        const envTitle = await this.question('  Display title: ');
        const envDefault = await this.question('  Default value (optional): ');
        const envType = (await this.question('  Type (string/boolean/number) [string]: ')) || 'string';

        globalEnvVars.push({
          name: envName,
          title: envTitle,
          default: envDefault || undefined,
          type: envType as 'string' | 'boolean' | 'number',
        });
      }
    }

    return {
      slug,
      name,
      description,
      website: website || undefined,
      services,
      globalEnvVars: globalEnvVars.length > 0 ? globalEnvVars : undefined,
    };
  }

  private async generateTemplate(config: TemplateConfig) {
    const templatePath = path.join(__dirname, '..', 'templates', config.slug);

    // Create directory structure
    await fs.ensureDir(path.join(templatePath, 'assets'));

    // Generate meta.yaml
    const metaYaml = this.generateMetaYaml(config);
    await fs.writeFile(path.join(templatePath, 'meta.yaml'), metaYaml);

    // Generate index.ts
    const indexTs = this.generateIndexTs(config);
    await fs.writeFile(path.join(templatePath, 'index.ts'), indexTs);

    // Create placeholder assets
    await this.createPlaceholders(templatePath);
  }

  private generateMetaYaml(config: TemplateConfig): string {
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

    // Add service name fields
    for (const service of config.services) {
      const fieldName = `${service.name}ServiceName`;
      schema.properties[fieldName] = {
        type: 'string',
        title: `${service.name} Service Name`,
        default: service.name,
      };
      schema.required.push(fieldName);

      // Add image field for app services
      if (service.type === 'app' && service.image) {
        const imageField = `${service.name}ServiceImage`;
        schema.properties[imageField] = {
          type: 'string',
          title: `${service.name} Docker Image`,
          default: service.image,
        };
        schema.required.push(imageField);
      }
    }

    // Add global env vars
    if (config.globalEnvVars) {
      for (const env of config.globalEnvVars) {
        schema.properties[env.name] = {
          type: env.type,
          title: env.title,
        };
        if (env.default) {
          schema.properties[env.name].default = env.default;
        }
      }
    }

    const meta = {
      name: config.name,
      description: config.description,
      instructions: null,
      changeLog: [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'First release',
        },
      ],
      links: config.website
        ? [
            { label: 'Website', url: config.website },
            { label: 'Documentation', url: config.website },
          ]
        : [],
      contributors: [
        {
          name: 'Easypanel',
          url: 'https://easypanel.io',
        },
      ],
      schema,
    };

    return yaml.stringify(meta);
  }

  private generateIndexTs(config: TemplateConfig): string {
    let code = `import { Output, randomPassword, Services } from "~templates-utils";\nimport { Input } from "./meta";\n\n`;
    code += `export function generate(input: Input): Output {\n`;
    code += `  const services: Services = [];\n\n`;

    // Generate passwords for databases
    const dbPasswords: Record<string, string> = {};
    for (const service of config.services) {
      if (service.type !== 'app') {
        const varName = `${service.name}Password`;
        dbPasswords[service.name] = varName;
        code += `  const ${varName} = randomPassword();\n`;
      }
    }

    if (Object.keys(dbPasswords).length > 0) {
      code += `\n`;
    }

    // Generate each service
    for (const service of config.services) {
      code += `  // ${service.name} Service\n`;

      if (service.type === 'app') {
        code += `  services.push({\n`;
        code += `    type: "app",\n`;
        code += `    data: {\n`;
        code += `      serviceName: input.${service.name}ServiceName,\n`;

        // Source
        code += `      source: {\n`;
        code += `        type: "image",\n`;
        code += `        image: input.${service.name}ServiceImage,\n`;
        code += `      },\n`;

        // Environment variables
        code += `      env: [\n`;
        if (config.globalEnvVars) {
          for (const env of config.globalEnvVars) {
            if (env.type === 'boolean') {
              code += `        \`${env.name}=\${input.${env.name} ? 'true' : 'false'}\`,\n`;
            } else {
              code += `        \`${env.name}=\${input.${env.name} || ''}\`,\n`;
            }
          }
        }
        code += `      ].join("\\n"),\n`;

        // Mounts (files and volumes)
        if (service.mountedFiles && service.mountedFiles.length > 0) {
          code += `      mounts: [\n`;
          for (const file of service.mountedFiles) {
            // Generate the file content as a template literal
            const escapedContent = file.content
              .replace(/\\/g, '\\\\')
              .replace(/`/g, '\\`')
              .replace(/\$/g, '\\$');

            code += `        {\n`;
            code += `          type: "file",\n`;
            code += `          content: \`${escapedContent}\`,\n`;
            code += `          mountPath: "${file.mountPath}",\n`;
            code += `        },\n`;
          }
          code += `      ],\n`;
        }

        // Domains
        if (service.port) {
          code += `      domains: [\n`;
          code += `        {\n`;
          code += `          host: "$(EASYPANEL_DOMAIN)",\n`;
          code += `          port: ${service.port},\n`;
          code += `        },\n`;
          code += `      ],\n`;
        }

        // Deploy command
        if (service.command) {
          code += `      deploy: {\n`;
          code += `        command: "${service.command}",\n`;
          code += `      },\n`;
        }

        code += `    },\n`;
        code += `  });\n\n`;
      } else {
        // Database service
        code += `  services.push({\n`;
        code += `    type: "${service.type}",\n`;
        code += `    data: {\n`;
        code += `      serviceName: input.${service.name}ServiceName,\n`;
        code += `      password: ${dbPasswords[service.name]},\n`;
        code += `    },\n`;
        code += `  });\n\n`;
      }
    }

    code += `  return { services };\n`;
    code += `}\n`;

    return code;
  }

  private async createPlaceholders(templatePath: string) {
    const assetsPath = path.join(templatePath, 'assets');
    await fs.writeFile(
      path.join(assetsPath, 'logo.png.placeholder'),
      'Add logo.png or logo.svg here (512x512px recommended)'
    );
    await fs.writeFile(
      path.join(assetsPath, 'screenshot.png.placeholder'),
      'Add screenshot.png here (1200x630px recommended)'
    );
  }
}

// Run the creator
if (require.main === module) {
  const creator = new AdvancedTemplateCreator();
  creator.run();
}

export default AdvancedTemplateCreator;
