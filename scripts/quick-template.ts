#!/usr/bin/env ts-node
/**
 * Quick Template Generator
 *
 * Generate templates quickly from command line arguments without interactive prompts.
 *
 * Usage:
 *   ts-node scripts/quick-template.ts <slug> <name> <image> [options]
 *
 * Examples:
 *   # Simple app
 *   ts-node scripts/quick-template.ts myapp "My App" myapp/myapp:latest
 *
 *   # App with PostgreSQL
 *   ts-node scripts/quick-template.ts myapp "My App" myapp/myapp:latest --pattern postgres
 *
 *   # App with PostgreSQL and Redis
 *   ts-node scripts/quick-template.ts myapp "My App" myapp/myapp:latest --pattern postgres --redis
 *
 * Options:
 *   --pattern <type>       Database pattern: postgres|mysql|mongo|mariadb|redis (default: none)
 *   --redis               Add Redis cache
 *   --port <number>        Default port (default: 3000)
 *   --description <text>   Description
 *   --website <url>        Website URL
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';

interface QuickTemplateOptions {
  slug: string;
  name: string;
  image: string;
  pattern?: 'postgres' | 'mysql' | 'mongo' | 'mariadb' | 'redis';
  redis?: boolean;
  port?: number;
  description?: string;
  website?: string;
}

class QuickTemplateGenerator {
  async generate(options: QuickTemplateOptions) {
    const {
      slug,
      name,
      image,
      pattern,
      redis = false,
      port = 3000,
      description = `Deploy ${name} on Easypanel`,
      website,
    } = options;

    // Validate slug
    if (!slug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    const templatePath = path.join(__dirname, '..', 'templates', slug);

    // Check if template exists
    if (await fs.pathExists(templatePath)) {
      throw new Error(`Template "${slug}" already exists!`);
    }

    console.log(`Creating template: ${slug}`);

    // Create directory structure
    await fs.ensureDir(path.join(templatePath, 'assets'));

    // Generate meta.yaml
    const metaYaml = this.generateMetaYaml({
      slug,
      name,
      description,
      website,
      image,
      pattern,
      redis,
    });
    await fs.writeFile(path.join(templatePath, 'meta.yaml'), metaYaml);

    // Generate index.ts
    const indexTs = this.generateIndexTs({
      slug,
      pattern,
      redis,
      port,
    });
    await fs.writeFile(path.join(templatePath, 'index.ts'), indexTs);

    // Create placeholder assets
    await this.createPlaceholders(templatePath);

    console.log(`✅ Template created at: templates/${slug}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Add logo: templates/${slug}/assets/logo.png`);
    console.log(`  2. Add screenshot: templates/${slug}/assets/screenshot.png`);
    console.log(`  3. Customize: templates/${slug}/meta.yaml`);
    console.log(`  4. Test: npm run dev`);
    console.log(`  5. Build: npm run build-templates`);
  }

  private generateMetaYaml(options: {
    slug: string;
    name: string;
    description: string;
    website?: string;
    image: string;
    pattern?: string;
    redis?: boolean;
  }): string {
    const { slug, name, description, website, image, pattern, redis } = options;

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
          default: slug,
        },
        appServiceImage: {
          type: 'string',
          title: 'App Service Image',
          default: image,
        },
      },
    };

    // Add database service if pattern is set
    if (pattern) {
      const dbName = this.getDatabaseDisplayName(pattern);
      schema.required.push('databaseServiceName');
      schema.properties.databaseServiceName = {
        type: 'string',
        title: `${dbName} Service Name`,
        default: `${slug}-db`,
      };
    }

    // Add Redis if needed
    if (redis) {
      schema.properties.redisServiceName = {
        type: 'string',
        title: 'Redis Service Name',
        default: `${slug}-redis`,
      };
    }

    const meta = {
      name,
      description,
      instructions: null,
      changeLog: [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'First release',
        },
      ],
      links: website
        ? [
            { label: 'Website', url: website },
            { label: 'Documentation', url: website },
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

  private generateIndexTs(options: {
    slug: string;
    pattern?: string;
    redis?: boolean;
    port: number;
  }): string {
    const { slug, pattern, redis, port } = options;

    let code = `import { Output, randomPassword, Services } from "~templates-utils";\nimport { Input } from "./meta";\n\n`;
    code += `export function generate(input: Input): Output {\n`;
    code += `  const services: Services = [];\n\n`;

    // Generate database if needed
    if (pattern) {
      code += `  // ${this.getDatabaseDisplayName(pattern)} Database\n`;
      code += `  const databasePassword = randomPassword();\n`;
      code += `  services.push({\n`;
      code += `    type: "${pattern}",\n`;
      code += `    data: {\n`;
      code += `      serviceName: input.databaseServiceName,\n`;
      code += `      password: databasePassword,\n`;
      code += `    },\n`;
      code += `  });\n\n`;
    }

    // Generate Redis if needed
    if (redis) {
      code += `  // Redis Cache\n`;
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
    code += `  // Application Service\n`;
    code += `  const appEnv: string[] = [\n`;

    if (pattern) {
      const connString = this.getConnectionString(pattern, 'databasePassword');
      code += `    ${connString},\n`;
    }

    if (redis) {
      code += `    \`REDIS_URL=redis://:\${redisPassword}@$(PROJECT_NAME)_\${input.redisServiceName}:6379\`,\n`;
    }

    code += `  ];\n\n`;

    code += `  services.push({\n`;
    code += `    type: "app",\n`;
    code += `    data: {\n`;
    code += `      serviceName: input.appServiceName,\n`;
    code += `      env: appEnv.join("\\n"),\n`;
    code += `      source: {\n`;
    code += `        type: "image",\n`;
    code += `        image: input.appServiceImage,\n`;
    code += `      },\n`;
    code += `      domains: [\n`;
    code += `        {\n`;
    code += `          host: "$(EASYPANEL_DOMAIN)",\n`;
    code += `          port: ${port},\n`;
    code += `        },\n`;
    code += `      ],\n`;
    code += `    },\n`;
    code += `  });\n\n`;

    code += `  return { services };\n`;
    code += `}\n`;

    return code;
  }

  private getDatabaseDisplayName(pattern: string): string {
    const map: Record<string, string> = {
      postgres: 'PostgreSQL',
      mysql: 'MySQL',
      mongo: 'MongoDB',
      redis: 'Redis',
      mariadb: 'MariaDB',
    };
    return map[pattern] || 'Database';
  }

  private getConnectionString(pattern: string, passwordVar: string): string {
    const connStrings: Record<string, string> = {
      postgres: `\`DATABASE_URL=postgresql://postgres:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:5432/$(PROJECT_NAME)\``,
      mysql: `\`DATABASE_URL=mysql://mysql:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:3306/$(PROJECT_NAME)\``,
      mariadb: `\`DATABASE_URL=mysql://mariadb:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:3306/$(PROJECT_NAME)\``,
      mongo: `\`MONGODB_URL=mongodb://mongo:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:27017/$(PROJECT_NAME)\``,
      redis: `\`REDIS_URL=redis://:\${${passwordVar}}@$(PROJECT_NAME)_\${input.databaseServiceName}:6379\``,
    };
    return connStrings[pattern] || `\`DATABASE_URL=change-me\``;
  }

  private async createPlaceholders(templatePath: string) {
    const assetsPath = path.join(templatePath, 'assets');

    // Create placeholder text files
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

// Parse command line arguments
function parseArgs(): QuickTemplateOptions | null {
  const args = process.argv.slice(2);

  if (args.length < 3 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Quick Template Generator

Usage:
  npm run quick-template -- <slug> <name> <image> [options]

Arguments:
  slug         Template slug (lowercase, e.g., myapp)
  name         Display name (e.g., "My App")
  image        Docker image (e.g., myapp/myapp:latest)

Options:
  --pattern <type>       Database: postgres|mysql|mongo|mariadb|redis
  --redis               Add Redis cache
  --port <number>        Default port (default: 3000)
  --description <text>   Short description
  --website <url>        Website URL

Examples:
  npm run quick-template -- myapp "My App" myapp/myapp:latest
  npm run quick-template -- myapp "My App" myapp/myapp:latest --pattern postgres
  npm run quick-template -- myapp "My App" myapp/myapp:latest --pattern postgres --redis --port 8080
`);
    return null;
  }

  const [slug, name, image] = args;
  const options: QuickTemplateOptions = { slug, name, image };

  for (let i = 3; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--pattern' && args[i + 1]) {
      options.pattern = args[++i] as any;
    } else if (arg === '--redis') {
      options.redis = true;
    } else if (arg === '--port' && args[i + 1]) {
      options.port = parseInt(args[++i], 10);
    } else if (arg === '--description' && args[i + 1]) {
      options.description = args[++i];
    } else if (arg === '--website' && args[i + 1]) {
      options.website = args[++i];
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  if (!options) {
    process.exit(0);
  }

  try {
    const generator = new QuickTemplateGenerator();
    await generator.generate(options);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default QuickTemplateGenerator;
