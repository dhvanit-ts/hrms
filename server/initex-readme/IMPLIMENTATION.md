# Initex

**Initex** is a simple, interactive CLI tool to scaffold an Express-style backend project using either guided prompts or reusable preset files.

It exists because backend setup is a boring loop of the same decisions every time. Runtime. Database. Auth. Cache. Tooling. Initex standardizes those choices, makes them explicit, and lets you reuse them without copy-pasting your soul between projects.

---

## Why Initex Exists

Setting up backend projects repeatedly involves answering the same questions:

* Which runtime?
* Which database and ORM?
* Auth or no auth?
* Cache?
* SMTP?
* Sockets?
* Tooling?

Initex solves this by:

* Making those decisions **explicit**
* Allowing them to be **saved and reused**
* Cutting setup time without hiding configuration behind magic

Minimal defaults. Everything else is opt-in.

---

## Features

* Interactive and preset-based project generation
* First-class preset file support
* Database, cache, auth, SMTP, and socket configuration
* Supports modern runtimes and package managers
* Explicit configuration, no hidden behavior

---

## What It Generates

**Folder structure and key files**

> Intentionally left blank for now.
> Yes, this is fine. Ship the tool first.

---

## Requirements

* Node.js
* A supported runtime:

  * Node.js
  * Bun
* A package manager:

  * npm
  * pnpm
  * yarn
  * bun

(Your config decides which one actually matters.)

---

## Installation

### Install globally

```bash
npm install -g initex
```

### Run without installing

```bash
npx initex
```

---

## Quick Start

### Interactive setup

```bash
initex my-app
```

If no options are provided, Initex runs in interactive mode.

### Preset-based setup

```bash
initex --preset ./initex.preset.json
```

---

## Preset File Support

Initex supports configuration via a preset file.

Supported file formats:

* `initex.preset.json`
* `initex.preset.yml`

### Example Preset

```json
{
  "name": "myawesomeapp",
  "runtime": "bun",
  "packageManager": "bun",
  "db": {
    "enable": true,
    "provider": "postgresql",
    "connectionString": "postgres://postgres:password@localhost:5432/myawesomeapp",
    "orm": "drizzle",
    "name": "myawesomeapp"
  },
  "cache": {
    "enable": true,
    "service": "multi"
  },
  "auth": {
    "enable": true
  },
  "smtp": {
    "enable": true,
    "service": "gmail"
  },
  "git": true,
  "socket": true
}
```

---

## Preset Options (Updated)

### `name` (required)

Project name.

```json
"name": "myawesomeapp"
```

Must be a non-empty string.

---

### `runtime`

Runtime environment.

```json
"runtime": "node"
```

Supported values:

* `node` (default)
* `deno`
* `bun`

---

### `packageManager`

Package manager to use.

```json
"packageManager": "pnpm"
```

Supported values:

* `npm` (default)
* `yarn`
* `pnpm`
* `bun`
* `deno`

---

### `db`

Database configuration.

```json
"db": {
  "enable": true,
  "provider": "postgresql",
  "connectionString": "...",
  "orm": "drizzle",
  "name": "mydb"
}
```

#### Fields

* `enable`
  Boolean. Defaults to `false`.

When `enable: true`, the following fields become **required**:

* `provider`
  Supported values:

  * `mongodb`
  * `postgresql`
  * `mysql`

* `connectionString`
  Must be a valid URL string.

* `name`
  Database name. Non-empty string.

Optional:

* `orm`
  Supported values:

  * `mongoose`
  * `prisma`
  * `sequelize`
  * `drizzle`

---

### `cache`

Cache configuration.

```json
"cache": {
  "enable": true,
  "service": "multi"
}
```

#### Fields

* `enable`
  Boolean. Defaults to `false`.

* `service`
  Supported values:

  * `nodecache` – L1 in-memory cache
  * `multi` – L1 (NodeCache) + L2 (Redis)

> Note: `redis` alone is **not** currently supported by the schema.
> If you plan to add it, update both Zod and docs at the same time.

---

### `auth`

Authentication setup.

```json
"auth": {
  "enable": true
}
```

When enabled, authentication-related boilerplate is included.

---

### `smtp`

Email service configuration.

```json
"smtp": {
  "enable": true,
  "service": "resend"
}
```

#### Fields

* `enable`
  Boolean. Defaults to `false`.

* `service`
  Supported values:

  * `resend`
  * `gmail`

---

### `git`

Initialize a Git repository.

```json
"git": true
```

Defaults to `false`.

---

### `socket`

Enable socket support.

```json
"socket": true
```

Defaults to `false`.

---

## Generating a Preset

Generate a preset from an interactive run:

```bash
initex --generatePreset
```

### Default output location

```text
./<project-name>/.initex
```

### Custom path

```bash
initex --generatePreset ./initex.preset.json
```

---

## CLI Usage

```bash
initex [project-name] [options]
```

If no options are provided, Initex runs in interactive mode.

---

## Flags

| Flag               | Alias | Description                                  |
| ------------------ | ----- | -------------------------------------------- |
| `--mode`           | `-m`  | Execution mode (`start`, `test`, `test:bin`) |
| `--name`           | `-n`  | Project name                                 |
| `--preset`         | `-p`  | Use a preset file                            |
| `--generatePreset` | `-g`  | Generate a preset file                       |
| `--debug`          | `-d`  | Print resolved CLI configuration             |

---

## Example Outputs

> Add screenshots, CLI output snippets, or links to example repositories here.

Future-you will thank present-you for doing this.

---

## Contributing

1. Fork the repository
2. Create a focused branch
3. Make changes with clear commits
4. Add tests where applicable
5. Open a pull request

---

## Roadmap

* Idempotency API support where required
* Valkey support for caching
* SQLite database support
* Improved OpenAPI documentation
* Admin authentication and updated RBAC model
* BetterAuth integration
* AuthJS integration
* Clerk integration

---

## FAQ

**Q: Can presets be reused across projects?**
A: Yes. Presets are designed to be portable and reusable.

**Q: Does Initex require Bun if runtime is set to `bun`?**
A: Yes. The selected runtime must be installed locally.

---

## License

MIT
