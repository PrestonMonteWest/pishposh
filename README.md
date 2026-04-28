# PishPosh

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A free and open-source social media platform built with React and TypeScript. PishPosh aims to replicate the core social media experience.

## Platforms

Currently, the web is the only supported platform. Native iOS and Android apps are planned.

## Features

- User registration
- Email verification
- Creating posts
- Voting on posts

### Planned

- Following other users
- Saving posts
- Media uploads

## Tech Stack

### Frontend

- **Framework:** React 19 (with planned migration to Next.js)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router

### Backend

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Query Builder:** Kysely

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL

### PostgreSQL Setup

```sql
-- Run as the postgres superuser, e.g.:
--   sudo -u postgres psql

CREATE ROLE pishposh WITH LOGIN PASSWORD 'pishposh';

CREATE DATABASE pishposh OWNER pishposh;

-- On PostgreSQL 15+, the public schema no longer grants CREATE to PUBLIC by default,
-- so explicitly granting on the schema avoids permission errors when running migrations.
\connect pishposh
GRANT ALL ON SCHEMA public TO pishposh;
```

Password authentication must be configured for the PostgreSQL service.
Do **NOT** run this in a live environment with the default password!

### Installation

```bash
# Install dependencies
npm install

# Run migrations, generate types, and seed users and posts
npm run db:setup

# Start front- and backend servers
npm run dev
```

### Available Scripts

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start front- and backend servers        |
| `npm run dev:web`      | Start frontend server                   |
| `npm run dev:server`   | Start backend server                    |
| `npm run build`        | Build front- and backend for production |
| `npm run build:web`    | Build frontend for production           |
| `npm run build:server` | Build backend for production            |
| `npm run lint`         | Run ESLint                              |
| `npm run db:migrate`   | Run the latest migration files          |
| `npm run db:codegen`   | Generate the Kysely DB types            |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
