# 🍃 MongoDB Setup for Spotify Clone

## Option 1: Local MongoDB Installation

### 1. Install MongoDB
**Windows:**
```bash
# Download from: https://www.mongodb.com/try/download/community
# Or install with chocolatey:
choco install mongodb

# Or install with winget:
winget install MongoDB.Server
```

**macOS:**
```bash
# Install with Homebrew:
brew install mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. Start MongoDB Service
**Windows:**
```bash
# Start as Windows service (auto-starts on boot)
net start MongoDB

# Or run manually:
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable auto-start on boot
sudo systemctl enable mongod

# Or run manually:
mongod --dbpath /data/db
```

### 3. Verify Installation
```bash
# Connect to MongoDB shell
mongosh

# Should show MongoDB connection info
```

## Option 2: MongoDB Atlas (Cloud - Recommended)

### 1. Create Free Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (choose free M0 tier)

### 2. Setup Database Access
1. **Database Access** → **Add New Database User**
   - Username: `spotifyCloneUser`
   - Password: `generate strong password`
   - Database User Privileges: `Atlas admin`

### 3. Setup Network Access
1. **Network Access** → **Add IP Address**
   - For development: `0.0.0.0/0` (allow all)
   - For production: Add your specific IP

### 4. Get Connection String
1. **Clusters** → **Connect** → **Connect your application**
2. Copy the connection string (looks like):
   ```
   mongodb+srv://spotifyCloneUser:<password>@cluster0.xxxxx.mongodb.net/spotify-clone
   ```

## 🔧 Configuration

### 1. Update Environment Variables
Create/update your `.env` file in the `backend` folder:

```env
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/spotify-clone

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://spotifyCloneUser:your-password@cluster0.xxxxx.mongodb.net/spotify-clone

# Add other required variables:
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Test Connection
```bash
npm start
```

You should see:
```
🍃 MongoDB Connected: localhost:27017
📗 Mongoose connected to MongoDB
🎵 Spotify Clone Backend running on http://localhost:3000
```

## 🗃️ Database Structure

Your MongoDB will automatically create these collections:

### Users Collection
- User profiles and preferences
- Liked tracks
- Recently played history
- Custom playlists

### Tracks Collection
- Song metadata from Spotify
- Play counts
- User interactions

### Playlists Collection
- Custom user playlists
- Track lists
- Playlist metadata

## 🧪 Test Database Integration

### 1. Start Your App
```bash
cd backend
npm start
```

### 2. Login with Spotify
- Go to `http://localhost:3000`
- Login with your Spotify account

### 3. Check Database
```bash
# Connect to MongoDB shell
mongosh spotify-clone

# View collections
show collections

# View users
db.users.find().pretty()

# View tracks
db.tracks.find().pretty()
```

## 🚀 New Features Available

With MongoDB connected, your Spotify Clone now supports:

- ✅ **User Profiles** - Persistent user data
- ✅ **Listen History** - Track what users play
- ✅ **Like System** - Users can like/unlike tracks
- ✅ **Custom Playlists** - Create personal playlists
- ✅ **Play Counts** - Track song popularity
- ✅ **Recently Played** - Personal listening history
- ✅ **User Preferences** - Settings and customization

## 📊 API Endpoints

### Track Interactions
- `POST /track-play` - Track when a song is played
- `POST /like-track` - Like/unlike a track

### User Data
- `GET /recently-played` - Get user's recently played tracks
- `GET /listening-stats` - Get user listening statistics

### Playlists
- `POST /create-playlist` - Create custom playlist
- `GET /my-playlists` - Get user's custom playlists

## 🔧 Troubleshooting

### Connection Issues
1. **Check MongoDB is running**: `mongosh` should connect
2. **Verify connection string**: Check `.env` file
3. **Network access**: For Atlas, check IP whitelist
4. **Credentials**: Verify username/password for Atlas

### Permission Issues
1. **Database user**: Ensure user has read/write permissions
2. **IP whitelist**: Check Atlas network access settings

### Development Tips
1. **MongoDB Compass**: Visual database browser
2. **Studio 3T**: Advanced MongoDB GUI
3. **Logs**: Check `mongod.log` for errors

## 🎯 Next Steps

Once MongoDB is connected:
1. Test user login and data persistence
2. Play songs and check play tracking
3. Like songs and verify database updates
4. Create custom playlists
5. View listening statistics

Your Spotify Clone is now a full-stack application with persistent data storage! 🎵✨
