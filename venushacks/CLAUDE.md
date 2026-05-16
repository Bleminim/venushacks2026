# Maternal Heart App - Project Context

## Project Overview
We are building a React Native mobile app using Expo (SDK 54) to combat maternal mortality. The app helps pregnant and postpartum mothers track routine health metrics (blood pressure, glucose, A1C) and translates those numbers into actionable, long-term cardiovascular health insights. 

## Tech Stack & Rules
* **Framework:** Expo SDK 54, React Native.
* **Routing:** Expo Router (File-based routing in the `app/` directory).
* **Styling:** React Native StyleSheet or inline styling (UI should feel calming, supportive, and non-anxiety-inducing).
* **Data Visualization:** Use lightweight charting solutions or SVG for the health visualizers.
* **Best Practices:** Use functional components, React Hooks, and keep state management simple (React Context if necessary, otherwise local state). Avoid overly complex abstractions for the MVP.

## App Architecture (5-Tab Layout)
The app utilizes a standard bottom tab navigation (`app/(tabs)/`).

1.  **Home (Dashboard) - `index.tsx`**: Features the "Translation Engine." Displays today's latest BP/Glucose logs translated into plain-language advice and doctor-ready advocacy scripts.
2.  **Log (+) - `log.tsx`**: Data entry forms for Systolic/Diastolic Blood Pressure, pre/post-meal Glucose, and quarterly A1C.
3.  **Insights - `insights.tsx`**: Features the "Long-Term Health Visualizer." Displays charts projecting 10-to-20-year cardiovascular risk based on the user's logged trends.
4.  **Community - `community.tsx`**: A Reddit-style forum. Includes a categorized feed (e.g., "Postpartum BP") and the ability to attach anonymized health charts to posts.
5.  **Profile - `profile.tsx`**: User settings, anonymity toggles, and an export button to generate PDF/data reports for OB/GYN visits.

## Authentication & State Management
* **Authentication:** We use Clerk for React Native (`@clerk/clerk-expo`). Supported providers: Email, Phone, Google, Facebook, Apple. The root layout (`app/_layout.tsx`) must handle the ClerkProvider wrapping and route protection.
* **Global State:** We use the React Context API (`context/HealthContext.tsx`) to manage user health data. All health logs (BP, Glucose, A1C) must be stored in this context so the Home, Log, and Insights tabs share the exact same data source in real-time. Do not use local state for the main data array.

@AGENTS.md
