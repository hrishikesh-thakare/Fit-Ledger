<p align="center">
  <h1 align="center">FitLedger</h1>
  <p align="center">
    A workout tracking app built with React Native (Expo) and Payload CMS.
    <br />
    Build routines, log workouts, track body weight — all from your phone.
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#building-the-apk">Building the APK</a> •
  <a href="#license">License</a>
</p>

---

## Features

- **Routines** — Create, edit, and manage workout routines with exercises and sets.
- **Workout Tracking** — Start a workout from any routine, log sets with weight and reps in real time.
- **Workout History** — Browse past workouts with full details and summaries.
- **Body Weight Logging** — Track daily body weight with trend visualization.
- **Exercise Library** — Browse exercises by muscle group; create custom exercises.
- **Dashboard** — At-a-glance statistics, calendar view, and recent activity.
- **Dark & Light Themes** — Warm-neutral design system with automatic system-preference detection.
- **User Accounts** — Secure authentication with JWT tokens and encrypted local storage.

---

## Tech Stack

### Frontend (Mobile)

| Technology | Purpose |
| :--- | :--- |
| [Expo](https://expo.dev/) (SDK 54) | React Native framework and build toolchain |
| [React Native](https://reactnative.dev/) 0.81 | Cross-platform native UI |
| [React Navigation](https://reactnavigation.org/) | Stack and bottom-tab navigation |
| [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) | Encrypted token storage |
| [Async Storage](https://react-native-async-storage.github.io/async-storage/) | User preferences and cache |
| TypeScript | Static type checking |

### Backend (API + CMS)

| Technology | Purpose |
| :--- | :--- |
| [Payload CMS](https://payloadcms.com/) 3.70 | Headless CMS with auto-generated REST API |
| [Next.js](https://nextjs.org/) 15 | Server framework (hosts Payload) |
| [PostgreSQL](https://www.postgresql.org/) | Primary database |
| [Drizzle ORM](https://orm.drizzle.team/) | Database access layer |
| [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | Integration and E2E testing |

---

## Getting Started

### Prerequisites

- **Node.js** `^18.20.2` or `>=20.9.0`
- **npm** `>=9`
- **PostgreSQL** running locally (or a remote connection string)
- **Android Studio** (for Android emulator / APK builds) or a physical device with USB debugging

### 1. Clone the Repository

```bash
git clone https://github.com/hrishikesh-thakare/Fit-Ledger.git
cd Fit-Ledger
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in the required values:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/fit_ledger
PAYLOAD_SECRET=<any-random-string>
```

Start the backend dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`. The Payload admin panel is at `http://localhost:3000/admin`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

Set your API URL. For local development on a physical device, use your computer's local IP:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

For the deployed backend:

```env
EXPO_PUBLIC_API_URL=https://fit-ledger.vercel.app/api
```

Start the Expo development server:

```bash
npm run start
```

Press `a` to open on a connected Android device/emulator.

---

## Project Structure

```
Fit-Ledger/
├── backend/                    # Payload CMS + Next.js API server
│   ├── src/
│   │   ├── collections/        # Payload collection schemas
│   │   │   ├── Users.ts
│   │   │   ├── Exercises.ts
│   │   │   ├── MuscleGroups.ts
│   │   │   ├── Routines.ts
│   │   │   ├── RoutineExercises.ts
│   │   │   ├── RoutineSets.ts
│   │   │   ├── WorkoutDays.ts
│   │   │   ├── WorkoutExercises.ts
│   │   │   ├── WorkoutSets.ts
│   │   │   ├── BodyWeightLogs.ts
│   │   │   └── Media.ts
│   │   ├── app/api/            # Custom API routes
│   │   ├── lib/                # Shared utilities
│   │   └── payload.config.ts   # Payload configuration
│   └── package.json
│
├── frontend/                   # Expo React Native mobile app
│   ├── src/
│   │   ├── screens/            # App screens
│   │   │   ├── dashboard/      # Dashboard, statistics, calendar
│   │   │   ├── routines/       # Routine CRUD + detail views
│   │   │   ├── workout/        # Active workout + summary
│   │   │   ├── history/        # Workout history + detail
│   │   │   ├── bodyweight/     # Body weight logging
│   │   │   ├── exercises/      # Exercise history
│   │   │   ├── profile/        # User profile + settings
│   │   │   ├── login/          # Login screen
│   │   │   └── signup/         # Sign-up screen
│   │   ├── contexts/           # React contexts (Auth, Theme, Workout)
│   │   ├── components/         # Shared UI components
│   │   ├── navigation/         # React Navigation setup
│   │   ├── theme/              # Design system tokens
│   │   ├── api/                # API client + fetch helpers
│   │   └── auth.ts             # Secure token management
│   ├── android/                # Android native project
│   └── package.json
│
├── DESIGN_SYSTEM.md            # Color palette & typography reference
├── LICENSE                     # MIT License
└── README.md
```

---

## Building the APK

### Debug Build

A debug APK connects to Metro Bundler for hot-reloading. Requires your development machine to be running `npm run start`.

```bash
cd frontend/android
.\gradlew assembleDebug
```

Output: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

A release APK is a self-contained build with all JavaScript bundled inside. No development server needed.

```bash
cd frontend/android
.\gradlew assembleRelease
```

Output: `frontend/android/app/build/outputs/apk/release/app-release.apk`

> **Note:** Each build overwrites the previous APK at the same path.

### Install via ADB

```bash
adb install frontend/android/app/build/outputs/apk/release/app-release.apk
```

---

## Scripts

### Backend (`backend/`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:int` | Integration tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

### Frontend (`frontend/`)

| Command | Description |
| :--- | :--- |
| `npm run start` | Start Expo development server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Start web version |
| `npm run typecheck` | TypeScript type checking |

---

## Environment Variables

### Backend

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PAYLOAD_SECRET` | ✅ | Secret key for Payload CMS auth |

### Frontend

| Variable | Required | Description |
| :--- | :---: | :--- |
| `EXPO_PUBLIC_API_URL` | ✅ | Backend API base URL (must end with `/api`) |

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built by <a href="https://github.com/hrishikesh-thakare">Hrishikesh Thakare</a>
</p>
