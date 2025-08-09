const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Spotify user information
    spotifyId: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        sparse: true // Some users might not share email
    },
    profileImage: {
        type: String
    },
    country: {
        type: String
    },
    product: {
        type: String // free, premium, etc.
    },
    
    // App-specific data
    customPlaylists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }],
    
    likedTracks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Track'
    }],
    
    recentlyPlayed: [{
        track: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Track'
        },
        playedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // User preferences
    preferences: {
        autoplay: {
            type: Boolean,
            default: true
        },
        crossfade: {
            type: Number,
            default: 0,
            min: 0,
            max: 12
        },
        volume: {
            type: Number,
            default: 0.8,
            min: 0,
            max: 1
        }
    },
    
    // Authentication tokens (encrypted)
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ spotifyId: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
