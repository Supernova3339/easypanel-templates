# Template Creation Guide

This guide explains how to efficiently create new templates for Easypanel using the internal template generation tools.

## Table of Contents

- [Quick Start](#quick-start)
- [Tool Overview](#tool-overview)
- [Quick Template Generator](#quick-template-generator)
- [Interactive Template Creator](#interactive-template-creator)
- [Advanced Template Creator](#advanced-template-creator)
- [Docker Compose Converter](#docker-compose-converter)
- [Template Structure](#template-structure)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)
- [Advanced Customization](#advanced-customization)
- [Tool Comparison](#tool-comparison)

---

## Quick Start

### Create a simple app template (no database):

```bash
npm run quick-template -- myapp "My App" myapp/myapp:latest
```

### Create an app with PostgreSQL:

```bash
npm run quick-template -- myapp "My App" myapp/myapp:latest --pattern postgres
```

### Create an app with PostgreSQL and Redis:

```bash
npm run quick-template -- myapp "My App" myapp/myapp:latest --pattern postgres --redis
```

### Use interactive mode for complex templates:

```bash
npm run create-template
```

---

## Tool Overview

We provide **four tools** for template creation:

### 1. **Quick Template Generator** (`quick-template`)

Best for:
- Fast scaffolding
- Simple templates (app + database)
- Batch creation
- CI/CD automation

Usage:
```bash
npm run quick-template -- <slug> <name> <image> [options]
```

### 2. **Interactive Template Creator** (`create-template`)

Best for:
- Medium complexity templates
- Custom environment variables
- Volume mounts
- Guided step-by-step creation

Usage:
```bash
npm run create-template
```

### 3. **Advanced Template Creator** (`advanced-template`)

Best for:
- Complex multi-service templates
- Templates with mounted config files
- Multiple app services (workers, schedulers, etc.)
- Services with custom commands

Usage:
```bash
npm run advanced-template
```

### 4. **Docker Compose Converter** (`compose-to-template`)

Best for:
- Converting existing docker-compose.yml files
- Migrating projects to Easypanel
- Quick template creation from compose files

Usage:
```bash
npm run compose-to-template -- <path-to-compose.yml> <slug>
```

---

## Interactive Template Creator

The interactive tool guides you through creating a template step-by-step.

### Usage

```bash
npm run create-template
```

### Prompts

1. **Template slug**: Lowercase identifier (e.g., `myapp`)
2. **Template name**: Display name (e.g., `My App`)
3. **Description**: Short description for the template
4. **Website URL**: Official website (optional)
5. **Docker image**: Default Docker image (e.g., `myapp/myapp:latest`)
6. **Default port**: Port the app listens on (e.g., `3000`, `8080`)
7. **Pattern selection**: Choose from:
   - Simple (app only, no database)
   - App + PostgreSQL
   - App + MySQL
   - App + MongoDB
   - App + Redis
   - App + MariaDB
8. **Redis cache**: Add Redis (if not already selected as main database)
9. **Environment variables**: Add custom environment variables
10. **Volume mounts**: Add persistent storage volumes

### Example Session

```
Template slug: analytics
Template name: Analytics Dashboard
Short description: Real-time analytics and reporting
Website URL: https://example.com
Docker image: analytics/dashboard:latest
Default port: 3000
Choose pattern (1-6): 2
Add Redis cache? (y/n): y

Add environment variables? (leave empty to skip)
  Env var name: ADMIN_EMAIL
  Display title: Admin Email
  Default value: admin@example.com
  Type: string

Add volume mounts? (leave empty to skip)
  Volume name: data
  Container path: /app/data
  Display title: Application Data
```

---

## Quick Template Generator

Fast command-line template generation without interactive prompts.

### Syntax

```bash
npm run quick-template -- <slug> <name> <image> [options]
```

### Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `slug` | Template identifier (lowercase) | `myapp` |
| `name` | Display name | `"My App"` |
| `image` | Docker image | `myapp/myapp:latest` |

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--pattern <type>` | Add database: `postgres`, `mysql`, `mongo`, `mariadb`, `redis` | `--pattern postgres` |
| `--redis` | Add Redis cache | `--redis` |
| `--port <number>` | Default port (default: 3000) | `--port 8080` |
| `--description <text>` | Short description | `--description "My app description"` |
| `--website <url>` | Website URL | `--website https://example.com` |

### Examples

#### Simple App (No Database)

```bash
npm run quick-template -- \
  dozzle \
  "Dozzle" \
  amir20/dozzle:latest \
  --port 8080 \
  --description "Real-time Docker log viewer"
```

#### App with PostgreSQL

```bash
npm run quick-template -- \
  umami \
  "Umami Analytics" \
  ghcr.io/umami-software/umami:latest \
  --pattern postgres \
  --port 3000 \
  --website https://umami.is
```

#### App with MySQL and Redis

```bash
npm run quick-template -- \
  linkwarden \
  "LinkWarden" \
  ghcr.io/linkwarden/linkwarden:latest \
  --pattern mysql \
  --redis \
  --port 3000
```

#### App with MongoDB

```bash
npm run quick-template -- \
  appwrite \
  "Appwrite" \
  appwrite/appwrite:latest \
  --pattern mongo \
  --port 80
```

---

## Template Structure

After running either tool, you'll get this structure:

```
templates/myapp/
├── meta.yaml                    # Template metadata and form schema
├── index.ts                     # Template generator function
└── assets/
    ├── logo.png.placeholder     # Replace with actual logo
    └── screenshot.png.placeholder # Replace with actual screenshot
```

### Required Files

1. **meta.yaml** - Defines:
   - Template metadata (name, description, links)
   - Change log
   - JSON Schema for configuration form
   - Contributors

2. **index.ts** - Contains:
   - `generate()` function that creates service configuration
   - Uses Input type from generated `meta.ts`
   - Returns Output with services array

3. **assets/logo.png** - Square logo (512x512px recommended)

4. **assets/screenshot.png** - App screenshot (1200x630px recommended)

---

## Common Patterns

### Pattern 1: Simple App (No Database)

```typescript
// index.ts
import { Output, Services } from "~/utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  services.push({
    type: "app",
    data: {
      projectName: input.projectName,
      serviceName: input.appServiceName,
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 3000,
        },
      ],
    },
  });

  return { services };
}
```

### Pattern 2: App + PostgreSQL

```typescript
// index.ts
import { Output, randomPassword, Services } from "~/utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  // PostgreSQL Database
  const databasePassword = randomPassword();
  services.push({
    type: "postgres",
    data: {
      projectName: input.projectName,
      serviceName: input.databaseServiceName,
      password: databasePassword,
    },
  });

  // Application
  const appEnv = [
    `DATABASE_URL=postgresql://postgres:${databasePassword}@${input.projectName}_${input.databaseServiceName}:5432/${input.projectName}`,
  ];

  services.push({
    type: "app",
    data: {
      projectName: input.projectName,
      serviceName: input.appServiceName,
      env: appEnv.join("\n"),
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 3000,
        },
      ],
    },
  });

  return { services };
}
```

### Pattern 3: App + Database + Redis

```typescript
// index.ts
import { Output, randomPassword, Services } from "~/utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  // PostgreSQL Database
  const databasePassword = randomPassword();
  services.push({
    type: "postgres",
    data: {
      projectName: input.projectName,
      serviceName: input.databaseServiceName,
      password: databasePassword,
    },
  });

  // Redis Cache
  const redisPassword = randomPassword();
  services.push({
    type: "redis",
    data: {
      projectName: input.projectName,
      serviceName: input.redisServiceName,
      password: redisPassword,
    },
  });

  // Application
  const appEnv = [
    `DATABASE_URL=postgresql://postgres:${databasePassword}@${input.projectName}_${input.databaseServiceName}:5432/${input.projectName}`,
    `REDIS_URL=redis://:${redisPassword}@${input.projectName}_${input.redisServiceName}:6379`,
  ];

  services.push({
    type: "app",
    data: {
      projectName: input.projectName,
      serviceName: input.appServiceName,
      env: appEnv.join("\n"),
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 3000,
        },
      ],
    },
  });

  return { services };
}
```

---

## Best Practices

### 1. **Slug Naming**

- Use lowercase letters, numbers, and hyphens only
- Keep it short and memorable
- Match the official project name when possible
- Examples: `wordpress`, `ghost`, `n8n`, `twenty`

### 2. **Docker Images**

- Use official images when available
- Pin to specific tags or use `latest`
- Prefer verified publishers
- Examples:
  - `postgres:16-alpine`
  - `ghcr.io/linkwarden/linkwarden:latest`
  - `docker.io/library/redis:7`

### 3. **Environment Variables**

- Group related variables together
- Add comments to explain complex configurations
- Provide sensible defaults
- Use template variables: `$(PROJECT_NAME)`, `$(EASYPANEL_DOMAIN)`

### 4. **Volumes**

- Always mount data directories for persistence
- Use meaningful volume names
- Document the purpose of each mount
- Common mounts:
  - `/data` - Application data
  - `/config` - Configuration files
  - `/uploads` - User uploads

### 5. **Ports**

- Document the default port in meta.yaml
- Match the application's default when possible
- Common ports:
  - `3000` - Node.js apps
  - `8080` - Java/Go apps
  - `80` - Nginx, Apache
  - `5173` - Vite dev server

### 6. **Security**

- Always use `randomPassword()` for database passwords
- Never hardcode secrets
- Use environment variables for sensitive data
- Consider enabling `basicAuth` for admin interfaces

---

## Advanced Customization

### Adding Custom Environment Variables

Edit `meta.yaml` to add form fields:

```yaml
schema:
  type: object
  properties:
    adminEmail:
      type: string
      title: Admin Email
      default: admin@example.com
    enableDebug:
      type: boolean
      title: Enable Debug Mode
      default: false
    maxUploadSize:
      type: number
      title: Max Upload Size (MB)
      default: 100
```

Then use in `index.ts`:

```typescript
const appEnv = [
  `ADMIN_EMAIL=${input.adminEmail}`,
  `DEBUG=${input.enableDebug ? 'true' : 'false'}`,
  `MAX_UPLOAD_SIZE=${input.maxUploadSize}`,
];
```

### Adding Dropdown Selections

Use `oneOf` in meta.yaml:

```yaml
schema:
  type: object
  properties:
    databaseType:
      type: string
      title: Database Type
      oneOf:
        - const: postgres
          title: PostgreSQL
        - const: mysql
          title: MySQL
        - const: sqlite
          title: SQLite
      default: postgres
```

Then handle in `index.ts`:

```typescript
if (input.databaseType === "postgres") {
  services.push({ type: "postgres", ... });
} else if (input.databaseType === "mysql") {
  services.push({ type: "mysql", ... });
}
```

### Adding Volume Mounts

```typescript
services.push({
  type: "app",
  data: {
    // ... other config
    mounts: [
      {
        type: "volume",
        name: "data",
        mountPath: "/app/data",
      },
      {
        type: "volume",
        name: "uploads",
        mountPath: "/app/uploads",
      },
    ],
  },
});
```

### Using Docker Socket

For apps that need Docker access (like Portainer, Dozzle):

```typescript
services.push({
  type: "app",
  data: {
    // ... other config
    mounts: [
      {
        type: "bind",
        hostPath: "/var/run/docker.sock",
        mountPath: "/var/run/docker.sock",
      },
    ],
  },
});
```

---

## Advanced Template Creator

For complex templates with multiple services and mounted configuration files.

### Usage

```bash
npm run advanced-template
```

### Features

- **Multiple Services**: Add as many app services as needed (main app, workers, schedulers, etc.)
- **Mounted Files**: Create configuration files that get mounted into containers
- **Database Services**: Add PostgreSQL, MySQL, MongoDB, MariaDB, or Redis
- **Custom Commands**: Specify custom startup commands for each service
- **Global Environment Variables**: Add env vars that apply across all services

### Example Session

```
Template slug: mycomplex
Template name: My Complex App
Short description: A complex multi-service application
Website URL: https://example.com

=== Service Configuration ===

Service name: api
Service types:
1. app (application container)
Choose type (1-6): 1
  Docker image: myapp/api:latest
  Port: 3000
  Custom command: npm start
  Add mounted config files? (y/n): y
    Filename: config.json
    Mount path in container: /app/config/config.json
    File content (end with a line containing only "END"):
{
  "database": "$(PROJECT_NAME)_db",
  "port": 3000
}
END

Service name: worker
Service types:
1. app (application container)
Choose type (1-6): 1
  Docker image: myapp/worker:latest
  Port (optional, press Enter to skip):
  Custom command: npm run worker
  Add mounted config files? (y/n): n

Service name: db
Service types:
1. app (application container)
2. postgres
Choose type (1-6): 2

Service name: (press Enter if done)

=== Global Environment Variables ===
Add global env vars? (y/n): y
  Env var name: API_KEY
  Display title: API Key
  Default value:
  Type (string/boolean/number) [string]: string
```

This will generate:
- `meta.yaml` with fields for all services and environment variables
- `index.ts` with multiple `services.push()` calls
- Mounted file content included in the code

---

## Docker Compose Converter

Convert existing `docker-compose.yml` files into Easypanel templates automatically.

### Usage

```bash
npm run compose-to-template -- <path-to-compose.yml> <template-slug>
```

### Examples

```bash
# Convert a local docker-compose file
npm run compose-to-template -- ./docker-compose.yml myapp

# Convert from another directory
npm run compose-to-template -- ~/projects/myapp/docker-compose.yml myapp

# Show help
npm run compose-to-template -- --help
```

### What It Does

1. **Analyzes** your docker-compose.yml file
2. **Detects** database services (postgres, mysql, mongo, redis, mariadb)
3. **Identifies** application services
4. **Extracts**:
   - Environment variables
   - Volume mounts
   - Port mappings
   - Commands
   - Service dependencies
5. **Generates**:
   - Complete `meta.yaml` with schema
   - Working `index.ts` with all services
   - `CONVERSION_NOTES.md` with manual review items

### Example docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    environment:
      - NGINX_HOST=example.com
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api

  api:
    image: node:18
    command: npm start
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/mydb
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:alpine

volumes:
  db-data:
```

### Conversion Result

```bash
npm run compose-to-template -- ./docker-compose.yml myapp
```

Creates:
```
templates/myapp/
├── meta.yaml              # Schema with fields for all services
├── index.ts               # 4 services generated
├── CONVERSION_NOTES.md    # Review checklist
└── assets/
    ├── logo.png.placeholder
    └── screenshot.png.placeholder
```

Generated `index.ts` will have:
- PostgreSQL database service with random password
- Redis service with random password
- API service with environment variables
- Web service with configuration

### Manual Review Required

The converter will create `CONVERSION_NOTES.md` highlighting items to review:

- **Environment Variables**: Verify all env vars are correctly mapped
- **Volumes**: File mounts may need adjustment
- **Build Contexts**: Services with `build:` need manual configuration
- **Networks**: Docker Compose networks require manual setup
- **Dependencies**: Service dependencies may need reordering
- **Secrets**: Replace hardcoded passwords with `randomPassword()`

### Supported Features

✅ **Supported**:
- Service images
- Environment variables
- Ports/domains
- Named volumes
- Commands
- Database auto-detection
- Multi-service setups

⚠️ **Partially Supported** (needs review):
- Bind mounts (will be noted as TODO)
- Build contexts (needs manual image configuration)
- Complex environment variable interpolation

❌ **Not Supported** (manual implementation required):
- Docker Compose networks (use service names instead)
- Health checks (add manually if needed)
- Deployment constraints
- Secrets management (use meta.yaml fields instead)

### Tips for Best Results

1. **Simplify first**: Remove dev-only services before converting
2. **Use images**: Replace `build:` with actual image names if possible
3. **Review passwords**: Replace hardcoded passwords with schema fields
4. **Test thoroughly**: Always test the generated template
5. **Iterate**: Conversion is a starting point, customize as needed

---

## After Generation

### 1. Add Assets

Replace placeholder files:

```bash
templates/myapp/assets/logo.png        # 512x512px square logo
templates/myapp/assets/screenshot.png  # 1200x630px screenshot
```

### 2. Test Your Template

Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` and test your template in the playground.

### 3. Build Templates

Generate TypeScript types and metadata:

```bash
npm run build-templates
```

This creates:
- `templates/myapp/meta.ts` - Generated TypeScript types
- `templates/list.json` - Updated template list
- `templates/index.ts` - Updated template index

### 4. Customize

Review and enhance:
- Add more detailed descriptions
- Include setup instructions
- Add more environment variables
- Configure resource limits
- Add health checks

---

## Troubleshooting

### Template Already Exists

```
Error: Template "myapp" already exists!
```

**Solution**: Choose a different slug or delete the existing template.

### Invalid Slug

```
Error: Slug must contain only lowercase letters, numbers, and hyphens
```

**Solution**: Use only `a-z`, `0-9`, and `-` in your slug.

### Build Errors

If `npm run build-templates` fails, check:
- All required fields in meta.yaml are present
- YAML syntax is valid
- TypeScript in index.ts compiles
- All imports are correct

---

## Examples from Existing Templates

### Simple App: Dozzle

```bash
npm run quick-template -- \
  dozzle \
  "Dozzle" \
  amir20/dozzle:latest \
  --port 8080
```

### App with Database: Umami

```bash
npm run quick-template -- \
  umami \
  "Umami" \
  ghcr.io/umami-software/umami:latest \
  --pattern postgres \
  --port 3000
```

### Complex App: GitLab

For complex templates with many options, use interactive mode:

```bash
npm run create-template
```

---

## Getting Help

- Check existing templates in `templates/` for examples
- Review the main README.md
- Look at similar templates for guidance
- Test in the playground before submitting

---

## Next Steps

After creating your template:

1. ✅ Add logo and screenshot
2. ✅ Test in development mode
3. ✅ Build and verify
4. ✅ Document any special requirements
5. ✅ Submit a pull request

---

## Tool Comparison

Not sure which tool to use? Here's a quick comparison:

| Feature | quick-template | create-template | advanced-template | compose-to-template |
|---------|----------------|-----------------|-------------------|---------------------|
| **Speed** | ⚡⚡⚡ Fastest | ⚡⚡ Fast | ⚡ Slower | ⚡⚡ Fast |
| **Interactivity** | None (CLI only) | Interactive prompts | Interactive prompts | None (CLI only) |
| **Complexity** | Simple | Medium | Complex | Varies |
| **Multiple services** | ❌ No (1 app + 1 db) | ❌ No | ✅ Yes (unlimited) | ✅ Yes |
| **Mounted files** | ❌ No | ❌ No | ✅ Yes | ⚠️ Partial |
| **Custom commands** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Environment vars** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Volume mounts** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Worker services** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Best for** | Simple apps | Standard apps | Complex setups | Migration from Compose |

### Decision Tree

**Use `quick-template` when:**
- You need a template FAST
- It's a simple app with optional database
- You know all the parameters upfront
- Examples: Blog, CMS, simple web app

**Use `create-template` when:**
- You want guidance through the process
- You need custom environment variables
- You want volume mounts for data persistence
- Examples: Most standard applications

**Use `advanced-template` when:**
- You have multiple app services (workers, schedulers, etc.)
- You need to mount configuration files
- Services have custom startup commands
- Examples: OpnForm, TubeArchivist, complex microservices

**Use `compose-to-template` when:**
- You already have a docker-compose.yml file
- You're migrating an existing project
- You want a quick starting point to customize
- Examples: Any project with docker-compose

### Examples by Tool

#### `quick-template`
```bash
# Simple apps
npm run quick-template -- ghost "Ghost" ghost:latest
npm run quick-template -- dozzle "Dozzle" amir20/dozzle:latest --port 8080

# App with database
npm run quick-template -- umami "Umami" ghcr.io/umami-software/umami:latest --pattern postgres
```

#### `create-template`
Interactive - just run and follow prompts:
```bash
npm run create-template
```

#### `advanced-template`
For complex setups like:
- OpnForm (5 services: nginx, ui, api, worker, scheduler)
- Mastodon (multiple workers + sidekiq)
- Complex apps with config files

```bash
npm run advanced-template
```

#### `compose-to-template`
```bash
# Convert existing docker-compose
npm run compose-to-template -- ./path/to/docker-compose.yml myapp

# Real examples
npm run compose-to-template -- ~/projects/myapp/docker-compose.yml myapp
```

---

Happy template creating! 🚀
