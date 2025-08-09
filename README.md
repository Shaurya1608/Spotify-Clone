<<<<<<< HEAD
# 🎵 Spotify Clone Web App

A modern web application that integrates with the Spotify Web API to search for music, view playlists, and play 30-second track previews.

## ✨ Features

- **🔐 Spotify Authentication** - Secure OAuth login with Spotify
- **🔍 Music Search** - Search for songs, artists, and albums
- **🎵 Audio Previews** - Play 30-second track previews
- **📚 User Playlists** - View your personal Spotify playlists
- **👤 User Profile** - Display user information and avatar
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🏗️ Architecture

### Backend (Node.js + Express)
- Express server with CORS enabled
- Spotify OAuth 2.0 Authorization Code Flow
- Token management (access + refresh tokens)
- API proxy to keep client secrets secure
- Endpoints for search, user data, and playlists

### Frontend (HTML + CSS + JavaScript)
- Modern vanilla JavaScript (ES6+)
- Responsive CSS with glassmorphism design
- Real-time audio player with progress bar
- Local storage for token persistence
- Error handling and loading states

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account

### 2. Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your `Client ID` and `Client Secret`
4. Add redirect URI: `http://localhost:3000/callback`

### 3. Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env-example.txt .env

# Edit .env with your Spotify credentials
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
PORT=3000
```

### 4. Run the Application

```bash
# Start the backend server
npm start

# Or for development with auto-reload
npm run dev
```

5. Open your browser and visit `http://localhost:3000`

## 📁 Project Structure

```
spotify-clone/
├── backend/
│   ├── server.js          # Express server with Spotify API integration
│   ├── package.json       # Backend dependencies
│   ├── .env              # Environment variables (create this)
│   └── env-example.txt   # Environment template
├── frontend/
│   ├── index.html        # Main HTML structure
│   ├── style.css         # Modern CSS with glassmorphism
│   └── app.js           # Frontend JavaScript logic
└── README.md            # This file
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | Redirect to Spotify authorization |
| GET | `/callback` | Handle Spotify OAuth callback |
| POST | `/refresh_token` | Refresh expired access token |
| GET | `/search` | Search for tracks/artists/albums |
| GET | `/me` | Get current user profile |
| GET | `/playlists` | Get user's playlists |
| GET | `/track/:id` | Get specific track details |
| GET | `/health` | Server health check |

## 🎨 UI Components

- **Navigation Header** - Logo, search bar, user profile
- **Search Results** - Grid of track cards with preview buttons
- **User Playlists** - Grid of playlist cards
- **Audio Player** - Bottom player with controls and progress bar
- **Loading Spinner** - For async operations
- **Error Messages** - User-friendly error notifications

## 🔒 Security Features

- Client secret stored securely on backend
- Token refresh handling
- CORS protection
- Input validation and sanitization
- Error handling without exposing sensitive data

## 🎯 Technologies Used

### Backend
- **Express.js** - Web framework
- **Axios** - HTTP client for API requests
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **CSS3** - Modern styling with flexbox/grid
- **HTML5 Audio API** - For music playback
- **Local Storage** - Token persistence

## 🚧 Development

### Adding New Features

1. **New API Endpoint**: Add route in `backend/server.js`
2. **Frontend Integration**: Add method in `frontend/app.js`
3. **UI Components**: Update HTML/CSS as needed

### Available Scripts

```bash
# Backend development
cd backend
npm run dev      # Start with nodemon for auto-reload
npm start        # Production start

# No build process needed for frontend (vanilla JS)
```

## 🎵 Usage

1. **Login**: Click "Login with Spotify" to authenticate
2. **Search**: Use the search bar to find songs, artists, or albums
3. **Preview**: Click "Play Preview" to hear 30-second clips
4. **Playlists**: View your personal Spotify playlists
5. **Player**: Use the bottom audio player to control playback

## 🐛 Troubleshooting

### Common Issues

**"No access token" error**
- Make sure you're logged in with Spotify
- Check if tokens have expired (auto-refresh should handle this)

**"Search failed" error**
- Verify your Spotify app credentials in `.env`
- Check network connection
- Ensure Spotify API quotas haven't been exceeded

**Audio not playing**
- Some tracks don't have preview URLs from Spotify
- Check browser audio permissions
- Verify track has `preview_url` in API response

### Environment Variables

Make sure your `.env` file contains:
```env
SPOTIFY_CLIENT_ID=your_actual_client_id
SPOTIFY_CLIENT_SECRET=your_actual_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
PORT=3000
```

## 📄 License

This project is for educational purposes. Spotify data is subject to Spotify's terms of service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is a demo application. For production use, implement additional security measures, error handling, and scalability considerations.
=======
# Spotify-Clone
>>>>>>> c0228d37c033ef948b4e298b8be2b49f0d7a8272
