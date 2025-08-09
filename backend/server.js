const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

// MongoDB
const connectDB = require('./config/database');
const User = require('./models/User');
const Track = require('./models/Track');
const Playlist = require('./models/Playlist');
const UserService = require('./services/userService');
const TrackService = require('./services/trackService');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Helper function to generate random state for security
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Routes

// 1. Login route - redirects to Spotify authorization
app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';
  
  const authURL = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state
    });
  
  res.redirect(authURL);
});

// 2. Callback route - handles the redirect from Spotify
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  
  if (state === null) {
    res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
  } else {
    try {
      // Exchange authorization code for access token
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        querystring.stringify({
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          grant_type: 'authorization_code'
        }), {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Redirect to frontend with tokens
      res.redirect('/#' + querystring.stringify({
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: expires_in
      }));
      
    } catch (error) {
      console.error('Error exchanging code for tokens:', error.response?.data || error.message);
      res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
    }
  }
});

// 3. Refresh token route
app.post('/refresh_token', async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(400).json({ error: 'No refresh token provided' });
  }
  
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }), {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
});

// 4. Search route - proxy to Spotify API
app.get('/search', async (req, res) => {
  const { q, type = 'track', limit = 20 } = req.query;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  if (!q) {
    return res.status(400).json({ error: 'No search query provided' });
  }
  
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: { q, type, limit },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || 'Search failed' 
    });
  }
});

// 5. Get user profile (Enhanced with MongoDB)
app.get('/me', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  try {
    // Get user data from Spotify
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const spotifyUser = response.data;
    
    // Create or update user in database
    const dbUser = await UserService.createOrUpdateUser(spotifyUser);
    
    // Combine Spotify data with database data
    const enhancedUser = {
      ...spotifyUser,
      customPlaylists: dbUser.customPlaylists,
      likedTracks: dbUser.likedTracks,
      recentlyPlayed: dbUser.recentlyPlayed,
      preferences: dbUser.preferences
    };
    
    res.json(enhancedUser);
  } catch (error) {
    console.error('Get user profile error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || 'Failed to get user profile' 
    });
  }
});

// 6. Get user playlists
app.get('/playlists', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { limit = 6, offset = 0 } = req.query; // Reduced default limit
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      params: { 
        limit: Math.min(parseInt(limit), 20), // Max 20 to prevent large responses
        offset: parseInt(offset) || 0 
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 8000, // 8 second axios timeout
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Optimize response by only sending necessary data
    const optimizedData = {
      ...response.data,
      items: response.data.items?.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        images: playlist.images?.slice(0, 1), // Only keep first image
        tracks: { total: playlist.tracks?.total },
        owner: { display_name: playlist.owner?.display_name },
        public: playlist.public
      }))
    };
    
    res.json(optimizedData);
  } catch (error) {
    console.error('Get playlists error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      res.status(408).json({ error: 'Request timeout - Spotify API is slow' });
    } else {
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data || 'Failed to get playlists' 
      });
    }
  }
});

// 7. Get track details
app.get('/track/:id', async (req, res) => {
  const { id } = req.params;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  try {
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Get track error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || 'Failed to get track' 
    });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Spotify Clone Backend is running',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// === MONGODB-SPECIFIC ENDPOINTS ===

// Track a song play
app.post('/track-play', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { spotifyTrackId } = req.body;
  
  if (!accessToken || !spotifyTrackId) {
    return res.status(400).json({ error: 'Missing access token or track ID' });
  }
  
  try {
    // Get user from Spotify
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    // Get or create user in database
    const dbUser = await UserService.createOrUpdateUser(userResponse.data);
    
    // Get or create track in database
    const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const dbTrack = await TrackService.createOrUpdateTrack(trackResponse.data);
    
    // Increment play count
    await TrackService.incrementPlayCount(dbTrack._id);
    
    // Add to recently played
    await UserService.addToRecentlyPlayed(dbUser._id, dbTrack._id);
    
    res.json({ success: true, message: 'Play tracked successfully' });
  } catch (error) {
    console.error('Track play error:', error.message);
    res.status(500).json({ error: 'Failed to track play' });
  }
});

// Like/Unlike a track
app.post('/like-track', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { spotifyTrackId, action } = req.body; // action: 'like' or 'unlike'
  
  if (!accessToken || !spotifyTrackId || !action) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    // Get user
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const dbUser = await UserService.createOrUpdateUser(userResponse.data);
    
    // Get track
    const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const dbTrack = await TrackService.createOrUpdateTrack(trackResponse.data);
    
    // Toggle like
    const result = await UserService.toggleLikeTrack(dbUser._id, dbTrack._id);
    
    res.json(result);
  } catch (error) {
    console.error('Like track error:', error.message);
    res.status(500).json({ error: 'Failed to like/unlike track' });
  }
});

// Get user's recently played tracks
app.get('/recently-played', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { limit = 20 } = req.query;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  try {
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const dbUser = await UserService.getUserBySpotifyId(userResponse.data.id);
    if (!dbUser) {
      return res.json({ items: [] });
    }
    
    const recentTracks = await User.findById(dbUser._id)
      .populate({
        path: 'recentlyPlayed.track',
        model: 'Track'
      })
      .limit(parseInt(limit));
    
    res.json({ items: recentTracks.recentlyPlayed });
  } catch (error) {
    console.error('Recently played error:', error.message);
    res.status(500).json({ error: 'Failed to get recently played' });
  }
});

// Create custom playlist
app.post('/create-playlist', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { name, description, public: isPublic } = req.body;
  
  if (!accessToken || !name) {
    return res.status(400).json({ error: 'Missing access token or playlist name' });
  }
  
  try {
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const dbUser = await UserService.createOrUpdateUser(userResponse.data);
    
    const playlist = new Playlist({
      name,
      description,
      owner: dbUser._id,
      public: isPublic !== false
    });
    
    await playlist.save();
    
    // Add to user's playlists
    dbUser.customPlaylists.push(playlist._id);
    await dbUser.save();
    
    res.json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error.message);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Get user's custom playlists
app.get('/my-playlists', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  try {
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const dbUser = await User.findOne({ spotifyId: userResponse.data.id })
      .populate('customPlaylists');
    
    if (!dbUser) {
      return res.json({ items: [] });
    }
    
    res.json({ items: dbUser.customPlaylists });
  } catch (error) {
    console.error('Get custom playlists error:', error.message);
    res.status(500).json({ error: 'Failed to get custom playlists' });
  }
});

// Get listening statistics
app.get('/listening-stats', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  
  try {
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const dbUser = await UserService.getUserBySpotifyId(userResponse.data.id);
    if (!dbUser) {
      return res.json({ stats: {} });
    }
    
    const stats = await UserService.getListeningStats(dbUser._id);
    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ error: 'Failed to get listening stats' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Spotify Clone Backend running on http://localhost:${PORT}`);
  console.log(`📝 Make sure to create a .env file with your Spotify credentials`);
  console.log(`🔑 Get credentials from: https://developer.spotify.com/dashboard`);
});

module.exports = app;
