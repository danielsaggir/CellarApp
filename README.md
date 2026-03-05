# CellarApp

**A fullstack wine cellar management app with AI-powered label scanning, drink-window estimates, and food pairing.**

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)
![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?logo=amazons3)

---

## Features

- **Wine collection management** -- add, edit, and delete wines with details like vintage, region, grapes, and personal notes
- **AI label scanning** -- snap a photo of a wine label and let OpenAI Vision extract the wine details automatically
- **AI drink window & market value** -- get AI-generated estimates for optimal drinking period and current market value
- **AI food pairing** -- enter a dish and receive a tailored wine pairing suggestion
- **Secure authentication** -- JWT-based login and registration with bcrypt password hashing
- **Cloud image storage** -- wine photos uploaded and served via AWS S3
- **Five wine types** -- Red, White, Rosé, Sparkling, and Orange

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Client** | React Native, TypeScript, React Navigation (Stack) |
| **Server** | Node.js, Express 5, TypeScript, Zod validation |
| **Database** | PostgreSQL 15, Prisma ORM |
| **AI** | OpenAI API (GPT-4o-mini for vision & insights) |
| **Storage** | AWS S3 (wine images) |
| **Auth** | JWT, bcrypt |
| **Infra** | Docker (Postgres container) |

---

## Architecture

```mermaid
graph LR
    MobileApp["React Native Client"] --> ExpressAPI["Express API :4000"]
    ExpressAPI --> PostgresDB["PostgreSQL (Docker)"]
    ExpressAPI --> OpenAI["OpenAI API"]
    ExpressAPI --> S3["AWS S3"]
```

---

## Project Structure

```
CellarApp/
├── client/                      # React Native mobile app
│   ├── App.tsx                  # Root component
│   ├── src/
│   │   ├── config.ts            # API URL configuration
│   │   ├── theme.ts             # Colors, spacing, typography
│   │   ├── types/               # TypeScript type definitions
│   │   ├── services/api.ts      # API client (auth, wines, AI)
│   │   ├── navigation/          # Stack navigator setup
│   │   └── screens/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── HomePage.tsx
│   │       ├── MyCellar.tsx
│   │       ├── WineForm.tsx
│   │       └── Pairing.tsx
│   ├── android/                 # Android native project
│   └── ios/                     # iOS native project
├── server/                      # Express backend
│   ├── prisma/
│   │   └── schema.prisma        # Database models
│   └── src/
│       ├── index.ts             # Server entry point
│       ├── routes/
│       │   ├── auth.ts          # Login / Register
│       │   ├── wines.ts         # CRUD + scan + insights
│       │   └── ai.ts            # Food-wine pairing
│       ├── services/
│       │   ├── aiService.ts     # OpenAI integration
│       │   └── s3Service.ts     # AWS S3 uploads
│       ├── middleware/           # Auth guard, validation
│       └── schemas/             # Zod request schemas
├── docker-compose.yml           # PostgreSQL container
└── package.json                 # Root scripts
```

---

## Prerequisites

- **Node.js** >= 20
- **Docker** (for the PostgreSQL container)
- **React Native environment** -- follow the [official setup guide](https://reactnative.dev/docs/set-up-your-environment) (Xcode for iOS, Android Studio for Android)
- **OpenAI API key**
- **AWS credentials** with an S3 bucket for image storage

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/danielsaggir/CellarApp.git
cd CellarApp
```

### 2. Install dependencies

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 3. Configure environment variables

Create a `server/.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cellar?schema=public"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="sk-..."
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="your-bucket-name"
```

### 4. Start the database

```bash
npm run db
```

### 5. Run Prisma migrations

```bash
cd server
npx prisma migrate dev
cd ..
```

### 6. Launch the app

Run everything at once (database, server, Metro bundler, and iOS simulator):

```bash
npm run wineapp
```

Or start each service individually -- see the **Available Scripts** section below.

---

## Available Scripts

All scripts are run from the project root.

| Script | Command | Description |
|--------|---------|-------------|
| `npm run db` | `docker-compose up -d` | Start the PostgreSQL container |
| `npm run db:down` | `docker-compose down` | Stop the PostgreSQL container |
| `npm run server` | `ts-node-dev src/index.ts` | Start the Express dev server |
| `npm run client:start` | `react-native start` | Start the Metro bundler |
| `npm run client:ios` | `react-native run-ios` | Build and run on iOS simulator |
| `npm run client:android` | `react-native run-android` | Build and run on Android emulator |
| `npm run wineapp` | _all of the above_ | Start DB, server, Metro, and iOS concurrently |

---

## Database Schema

The database uses two models with an implicit many-to-many relationship (a wine can belong to multiple users):

**User** -- `id`, `email`, `passwordHash`, `name`, `isAdmin`, `createdAt`, `updatedAt`

**Wine** -- `id`, `name`, `type`, `country`, `region`, `winery`, `vintage`, `amount`, `grapes`, `imageUrl`, `notes`, `drinkWindow`, `marketValue`, `createdAt`

**WineType** enum -- `RED`, `WHITE`, `ROSE`, `SPARKLING`, `ORANGE`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `OPENAI_API_KEY` | Yes | OpenAI API key for label scanning, insights, and pairing |
| `AWS_ACCESS_KEY_ID` | Yes | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS IAM secret key |
| `AWS_REGION` | No | AWS region (defaults to `us-east-1`) |
| `AWS_BUCKET_NAME` | Yes | S3 bucket name for wine images |
| `PORT` | No | Server port (defaults to `4000`) |

---

## Author

**Daniel Saggir** -- [GitHub](https://github.com/danielsaggir)

## License

This project is licensed under the ISC License.
