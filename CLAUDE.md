# CLAUDE.md

## Project Overview

**bet-slips-native** is a React Native (Expo) port of the bet-slips PWA — a horse racing bet tracker for iOS and Android. It calculates betting combinations, tracks bets across multiple tracks/bettors, determines win/loss outcomes, and logs payouts.

## Tech Stack

- **React Native** + **Expo** (managed workflow)
- **TypeScript**
- **Jest** + **React Native Testing Library** for tests
- **AsyncStorage** for persistence
- Target platforms: iOS (App Store) and Android (Google Play)

## Commands

```bash
npm run ios        # Run in iOS Simulator
npm run android    # Run in Android emulator
npm run web        # Run in browser (dev only)
npx expo start     # Start Expo dev server
npm test           # Run tests
```

## Versioning

Bump `version` in `package.json` for every change that warrants a GitHub push.

- **Patch** (`1.0.x`) — Bug fixes, minor UI tweaks, copy changes
- **Minor** (`1.x.0`) — New features, new bet types, new components
- **Major** (`x.0.0`) — Breaking changes to state shape, major architecture changes

## Workflow After Making Changes

After completing any code change, always do all of the following without being asked:

1. **Write tests** for any new logic or significant component behavior — unit tests in `betting.test.ts`/`outcomes.test.ts`, UI interaction tests in `components.test.tsx`
2. **Run tests** (`npm test`) — all suites must pass with no failures, including unit and component tests
3. **Bump version** in `package.json`
4. **Stage** the changed files
5. **Commit** with a descriptive message (format: `vX.Y.Z: <summary>` with bullet details in body)
6. **Push** to GitHub

## Commit Message Guidelines

- Format: `vX.Y.Z: Short summary` with bullet-point details in the body
- Do **not** include `Co-Authored-By` or any AI attribution lines in commit messages
