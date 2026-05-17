# Kardia

Kardia is a maternal health monitoring application designed to empower mothers during pregnancy and the postpartum period. It helps users track critical health metrics like blood pressure and glucose, translates complex medical data into easy-to-understand insights, and equips patients with the tools they need to advocate for themselves in clinical settings.

## Features

- **Translation Engine**: Kardia interprets your latest blood pressure (systolic, diastolic, MAP) and glucose readings, explaining what they mean based on ACOG (American College of Obstetricians and Gynecologists) guidelines.
- **Advocacy Script**: Automatically generates a script based on your recent health readings, helping you effectively communicate symptoms, concerns, and questions to your healthcare provider.
- **Health Logging**: Easy-to-use interface to log daily blood pressure, glucose, and A1C levels to identify trends early.
- **Community**: A supportive forum where mothers can connect, share experiences, and find solidarity in specific areas such as Postpartum BP, Gestational Diabetes, and Postpartum Anxiety.
- **Insights Dashboard**: Visualizes your health data over time, allowing you to track your progress and share concrete trends with your care team.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing
- **Authentication**: [Clerk](https://clerk.com/) for secure user authentication
- **UI & Icons**: Vanilla React Native stylesheets, `@expo/vector-icons`, and `@hugeicons/react-native`
- **Charts**: `react-native-gifted-charts` for data visualization

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator, or the Expo Go app on a physical device.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bleminim/venushacks2026.git
   cd venushacks2026/kardia
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   You will need to configure your Clerk environment variables for authentication to work properly. Create a `.env` file in the root of the `kardia` directory and add your keys (e.g., `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`).

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on a device or emulator:**
   - Press `i` to open in the iOS simulator.
   - Press `a` to open in the Android emulator.
   - Scan the QR code with the Expo Go app to test on a physical device.

## Project Structure

- `kardia/app/`: Contains the Expo Router file-based routing.
  - `(tabs)/`: Bottom tab navigation screens (Home, Community, Insights, Log, Profile).
  - `(auth)/`: Authentication screens (Sign In, Sign Up, Welcome).
  - `(app)/`: Authenticated screens and setup flows.
- `kardia/components/`: Reusable React components.
- `kardia/context/`: React Context providers for global state management (Health Context, Community Context, Auth).
- `kardia/constants/`: Shared constants like colors and typography.
- `kardia/assets/`: Images, fonts, and splash screen assets.
- `kardia/utils/`: Utility functions (e.g., calculating BP status).

## Why Kardia?

Maternal mortality and morbidity, particularly related to hypertensive disorders like preeclampsia and gestational diabetes, require careful monitoring. Kardia bridges the gap between home-monitoring and clinical visits by providing context, education, and community support—giving mothers confidence and clarity in their healthcare journey.
