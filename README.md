# 🚀 Nexus Chat

Nexus Chat is a real-time Progressive Web App (PWA) built with **Next.js**, **Firebase**, **Google Gemini AI**, and **WebRTC**. Designed with a modern dark glassmorphic aesthetic, Nexus Chat delivers real-time messaging, voice notes, media sharing, grouped 24-hour stories, AI context processing, and peer-to-peer video/audio calling.

---

## ✨ Key Features

- **⚡ Real-Time Messaging & Direct Messages**: Real-time message synchronization powered by Firebase Firestore with 1-on-1 private rooms and chronological message sorting.
- **🤖 Integrated Gemini AI (@gemini)**: Powered by Google Gemini (`gemini-2.5-flash`). Mention `@gemini` in any chat to query the AI, summarize chat history, or get instant answers directly in the conversation thread.
- **📞 Full-Screen WebRTC Voice & Video Calling**: Peer-to-peer calling using WebRTC (`RTCPeerConnection`) backed by Open Relay TURN configuration (`openrelay.metered.ca:80`) for cross-network connectivity, equipped with live stream controls (mute, camera toggle, end call).
- **📸 Multi-Image Story Carousel (Moments)**: 24-hour decaying user stories automatically grouped under single user avatar nodes with an Instagram-style continuous story viewer and timed progress bars.
- **🎙️ Voice Messages & Compressed Media Sharing**: Native audio recording and client-side HTML Canvas image payload compression before database storage to prevent document size limit crashes.
- **👤 Profile Management & Phone Verification**: Flexible international phone number support with auto-prefixing (`+91` default), displaying phone numbers in chat headers and profile pop-up modals.
- **🎨 Glassmorphic Dark UI & Customization**: Sleek glassmorphic theme with Light/Dark mode toggling and customizable chat wallpaper settings.
- **📱 Progressive Web App (PWA)**: Full web app manifest and service worker configuration allowing native home-screen installation on Android and iOS devices.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React 18 / 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism design system)
- **Database & Authentication**: [Firebase](https://firebase.google.com/) (Firestore & Firebase Auth)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
- **Real-Time Media**: WebRTC (`RTCPeerConnection`, `navigator.mediaDevices`)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm** or **yarn**
- **Firebase Project**: Firestore Database and Authentication enabled
- **Gemini API Key**: Available via [Google AI Studio](https://aistudio.google.com/)

---

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nexus-chat.git
   cd nexus-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the project root directory with the following variables:
   ```env
   # Firebase Credentials
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## ⚙️ Deployment on Vercel

1. Push your repository to GitHub.
2. Link the repository to a new project in **Vercel**.
3. Under **Project Settings $\rightarrow$ Environment Variables**, configure:
   - `GEMINI_API_KEY`
   - All `NEXT_PUBLIC_FIREBASE_*` keys
4. Deploy the project and trigger a fresh build to ensure environment variables are bound at build time.

---

## 👨‍💻 Developed By

Developed by **quantum noob** for hackathon submission.