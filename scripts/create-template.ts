#!/usr/bin/env ts-node
/**
 * Template Generator Tool for Easypanel Templates
 *
 * This tool helps you quickly scaffold new templates with common patterns.
 *
 * Usage:
 *   npm run create-template
 *   OR
 *   ts-node scripts/create-template.ts
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';
import * as yaml from 'yaml';

interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  website?: string;
  defaultImage: string;
  defaultPort: number;
  pattern: 'simple' | 'app-postgres' | 'app-mysql' | 'app-mongo' | 'app-redis' | 'app-mariadb';
  includeRedis?: boolean;
  environmentVariables?: Array<{
    name: string;
    title: string;
    default?: string;
    type: 'string' | 'boolean' | 'number';
    description?: string;
  }>;
  volumes?: Array<{
    name: string;
    path: string;
    title: string;
  }>;
}

class TemplateGenerator {
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
    console.log('║      Easypanel Template Generator                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
      const config = await this.collectInput();
      await this.generateTemplate(config);
      console.log('\n✅ Template created successfully!');
      console.log(`\nNext steps:`);
      console.log(`1. Add a logo at: templates/${config.slug}/assets/logo.png`);
      console.log(`2. Add a screenshot at: templates/${config.slug}/assets/screenshot.png`);
      console.log(`3. Review and customize: templates/${config.slug}/meta.yaml`);
      console.log(`4. Test your template: npm run dev`);
      console.log(`5. Build templates: npm run build-templates\n`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  private async collectInput(): Promise<TemplateConfig> {
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
    const defaultImage = await this.question('Docker image (e.g., myapp/myapp:latest): ');
    const defaultPort = parseInt(await this.question('Default port (e.g., 80, 3000, 8080): '), 10);

    console.log('\nSelect template pattern:');
    console.log('1. Simple (app only, no database)');
    console.log('2. App + PostgreSQL');
    console.log('3. App + MySQL');
    console.log('4. App + MongoDB');
    console.log('5. App + Redis');
    console.log('6. App + MariaDB');

    const patternChoice = await this.question('Choose pattern (1-6): ');
    const patterns: TemplateConfig['pattern'][] = [
      'simple',
      'app-postgres',
      'app-mysql',
      'app-mongo',
      'app-redis',
      'app-mariadb',
    ];
    const pattern = patterns[parseInt(patternChoice, 10) - 1] || 'simple';

    let includeRedis = false;
    if (pattern !== 'simple' && pattern !== 'app-redis') {
      const redisAnswer = await this.question('Add Redis cache? (y/n): ');
      includeRedis = redisAnswer.toLowerCase() === 'y';
    }

    // Ask for common environment variables
    console.log('\nAdd environment variables? (leave empty to skip)');
    const environmentVariables: TemplateConfig['environmentVariables'] = [];

    while (true) {
      const envName = await this.question('  Env var name (or press Enter to finish): ');
      if (!envName.trim()) break;

      const envTitle = await this.question('  Display title: ');
      const envDefault = await this.question('  Default value (optional): ');
      const envType = await this.question('  Type (string/boolean/number) [string]: ') || 'string';

      environmentVariables.push({
        name: envName,
        title: envTitle,
        default: envDefault || undefined,
        type: envType as 'string' | 'boolean' | 'number',
      });
    }

    // Ask for volumes
    console.log('\nAdd volume mounts? (leave empty to skip)');
    const volumes: TemplateConfig['volumes'] = [];

    while (true) {
      const volumeName = await this.question('  Volume name (or press Enter to finish): ');
      if (!volumeName.trim()) break;

      const volumePath = await this.question('  Container path (e.g., /data): ');
      const volumeTitle = await this.question('  Display title: ');

      volumes.push({
        name: volumeName,
        path: volumePath,
        title: volumeTitle,
      });
    }

    return {
      slug,
      name,
      description,
      website: website || undefined,
      defaultImage,
      defaultPort,
      pattern,
      includeRedis,
      environmentVariables: environmentVariables.length > 0 ? environmentVariables : undefined,
      volumes: volumes.length > 0 ? volumes : undefined,
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
    await this.createPlaceholderAssets(templatePath);
  }

  private generateMetaYaml(config: TemplateConfig): string {
    const schema: any = {
      type: 'object',
      required: ['projectName', 'appServiceName', 'appServiceImage'],
      properties: {
        projectName: {
          type: 'string',
          title: 'Project Name',
        },
        appServiceName: {
          type: 'string',
          title: 'App Service Name',
          default: config.slug,
        },
        appServiceImage: {
          type: 'string',
          title: 'App Service Image',
          default: config.defaultImage,
        },
      },
    };

    // Add database-specific fields
    if (config.pattern !== 'simple') {
      schema.required.push('databaseServiceName');
      schema.properties.databaseServiceName = {
        type: 'string',
        title: `${this.getDatabaseName(config.pattern)} Service Name`,
        default: `${config.slug}-db`,
      };
    }

    // Add Redis if needed
    if (config.includeRedis) {
      schema.properties.redisServiceName = {
        type: 'string',
        title: 'Redis Service Name',
        default: `${config.slug}-redis`,
      };
    }

    // Add custom environment variables
    if (config.environmentVariables) {
      for (const env of config.environmentVariables) {
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
          description: 'Initial template creation',
        },
      ],
      links: [
        ...(config.website ? [{ label: 'Website', url: config.website }] : []),
        { label: 'Documentation', url: config.website || 'https://example.com/docs' },
      ],
      contributors: [
        {
          name: 'Generated Template',
          url: 'https://easypanel.io',
        },
      ],
      schema,
    };

    return yaml.stringify(meta);
  }

  private generateIndexTs(config: TemplateConfig): string {
    const hasDatabase = config.pattern !== 'simple';
    const databaseType = this.getDatabaseType(config.pattern);

    let imports = `import { Output, randomPassword, Services } from "~templates-utils";\nimport { Input } from "./meta";\n\n`;

    let code = `export function generate(input: Input): Output {\n`;
    code += `  const services: Services = [];\n\n`;

    // Generate database if needed
    if (hasDatabase && databaseType) {
      code += `  // Database\n`;
      code += `  const databasePassword = randomPassword();\n`;
      code += `  services.push({\n`;
      code += `    type: "${databaseType}",\n`;
      code += `    data: {\n`;
      code += `      serviceName: input.databaseServiceName,\n`;
      code += `      password: databasePassword,\n`;
      code += `    },\n`;
      code += `  });\n\n`;
    }

    // Generate Redis if needed
    if (config.includeRedis) {
      code += `  // Redis\n`;
      code += `  const redisPassword = randomPassword();\n`;
      code += `  services.push({\n`;
      code += `    type: "redis",\n`;
      code += `    data: {\n`;
      code += `      serviceName: input.redisServiceName,\n`;
      code += `      password: redisPassword,\n`;
      code += `    },\n`;
      code += `  });\n\n`;
    }

    // Generate app service
    code += `  // Application\n`;
    code += `  const appEnv: string[] = [\n`;

    // Add database connection string
    if (hasDatabase) {
      const dbConnString = this.getDatabaseConnectionString(config.pattern, 'databasePassword');
      code += `    ${dbConnString},\n`;
    }

    // Add Redis connection
    if (config.includeRedis) {
      code += `    \`REDIS_URL=redis://:\${redisPassword}@$(PROJECT_NAME)_\${input.redisServiceName}:6379\`,\n`;
    }

    // Add custom environment variables
    if (config.environmentVariables) {
      for (const env of config.environmentVariables) {
        if (env.type === 'boolean') {
          code += `    \`${env.name}=\${input.${env.name} ? 'true' : 'false'}\`,\n`;
        } else {
          code += `    \`${env.name}=\${input.${env.name} || '${env.default || ''}'}\`,\n`;
        }
      }
    }

    code += `  ];\n\n`;

    // Mounts array
    const mounts: string[] = [];
    if (config.volumes) {
      for (const vol of config.volumes) {
        mounts.push(`{ type: "volume", name: "${vol.name}", mountPath: "${vol.path}" }`);
      }
    }

    code += `  services.push({\n`;
    code += `    type: "app",\n`;
    code += `    data: {\n`;
    code += `      serviceName: input.appServiceName,\n`;
    code += `      env: appEnv.join("\\n"),\n`;
    code += `      source: {\n`;
    code += `        type: "image",\n`;
    code += `        image: input.appServiceImage,\n`;
    code += `      },\n`;

    if (mounts.length > 0) {
      code += `      mounts: [\n`;
      code += `        ${mounts.join(',\n        ')},\n`;
      code += `      ],\n`;
    }

    code += `      domains: [\n`;
    code += `        {\n`;
    code += `          host: "$(EASYPANEL_DOMAIN)",\n`;
    code += `          port: ${config.defaultPort},\n`;
    code += `        },\n`;
    code += `      ],\n`;
    code += `    },\n`;
    code += `  });\n\n`;

    code += `  return { services };\n`;
    code += `}\n`;

    return imports + code;
  }

  private getDatabaseName(pattern: TemplateConfig['pattern']): string {
    const map: Record<string, string> = {
      'app-postgres': 'PostgreSQL',
      'app-mysql': 'MySQL',
      'app-mongo': 'MongoDB',
      'app-redis': 'Redis',
      'app-mariadb': 'MariaDB',
    };
    return map[pattern] || 'Database';
  }

  private getDatabaseType(pattern: TemplateConfig['pattern']): string | null {
    const map: Record<string, string> = {
      'app-postgres': 'postgres',
      'app-mysql': 'mysql',
      'app-mongo': 'mongo',
      'app-redis': 'redis',
      'app-mariadb': 'mariadb',
    };
    return map[pattern] || null;
  }

  private getDatabaseConnectionString(pattern: TemplateConfig['pattern'], passwordVar: string): string {
    const connStrings: Record<string, string> = {
      'app-postgres': `\`DATABASE_URL=postgresql://postgres:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:5432/$(PROJECT_NAME)\``,
      'app-mysql': `\`DATABASE_URL=mysql://mysql:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:3306/$(PROJECT_NAME)\``,
      'app-mariadb': `\`DATABASE_URL=mysql://mariadb:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:3306/$(PROJECT_NAME)\``,
      'app-mongo': `\`MONGODB_URL=mongodb://mongo:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:27017/$(PROJECT_NAME)\``,
      'app-redis': `\`REDIS_URL=redis://:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:6379\``,
    };
    return connStrings[pattern] || `\`DATABASE_URL=\${${passwordVar}}\``;
  }

  private async createPlaceholderAssets(templatePath: string) {
    const assetsPath = path.join(templatePath, 'assets');

    // Create a simple text file as placeholder for logo
    const logoPlaceholder = path.join(assetsPath, 'logo.png.placeholder');
    await fs.writeFile(
      logoPlaceholder,
      '⚠️  REPLACE THIS FILE\n\nAdd a square logo image (PNG or SVG) named:\n  - logo.png OR logo.svg\n\nRecommended size: 512x512px'
    );

    // Create a simple text file as placeholder for screenshot
    const screenshotPlaceholder = path.join(assetsPath, 'screenshot.png.placeholder');
    await fs.writeFile(
      screenshotPlaceholder,
      '⚠️  REPLACE THIS FILE\n\nAdd a screenshot image (PNG) named:\n  - screenshot.png\n\nRecommended size: 1200x630px or similar'
    );
  }
}

// Run the generator
if (require.main === module) {
  const generator = new TemplateGenerator();
  generator.run();
}

export default TemplateGenerator;
