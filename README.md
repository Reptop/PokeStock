# PokéStock Tracker 

A web app to track and report the stock of Pokémon vending machines in real-time, helping fans find what they need—and avoid scalpers.

##  Features

-  **Live Map View** using Leaflet.js to visualize vending machine locations and stock statuses.
-  **User-Submitted Reports** with image uploads and optional metadata verification.
-  **Real-Time Updates** with Firebase for fast, collaborative reporting.
-  **Search & Filter** by product availability, location, and date.
-  Community-driven reporting system to keep data fresh and reliable.

##  Tech Stack

### Frontend
- [Svelte](https://svelte.dev/) — Lightweight and reactive component framework
- [Leaflet.js](https://leafletjs.com/) — Interactive map library for displaying vending machines
- [Tailwind CSS](https://tailwindcss.com/) (optional) — Utility-first CSS framework for fast UI styling
- [SvelteKit](https://kit.svelte.dev/) (if using) — App framework for routing and SSR (optional)

### Backend
- [Firebase](https://firebase.google.com/)
  - **Firestore** — NoSQL database for storing reports
  - **Firebase Auth** — (optional) User authentication
  - **Firebase Storage** — For storing image uploads
  - **Cloud Functions** — (optional) For image verification and moderation

### Possible Libraries
- [Exif-js](https://github.com/exif-js/exif-js) — For extracting image metadata client-side
- [Geofirestore](https://github.com/geofirestore/geofirestore) — For geolocation queries on Firestore
- [Lottie or Heroicons](https://heroicons.com/) — Optional for enhanced visuals

## 🛠️ Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pokestock-tracker.git
   cd pokestock-tracker
