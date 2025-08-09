const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
    // Spotify track information
    spotifyId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    artists: [{
        id: String,
        name: String
    }],
    album: {
        id: String,
        name: String,
        images: [{
            url: String,
            height: Number,
            width: Number
        }]
    },
    durationMs: {
        type: Number
    },
    explicit: {
        type: Boolean,
        default: false
    },
    previewUrl: {
        type: String
    },
    popularity: {
        type: Number
    },
    externalUrls: {
        spotify: String
    },
    
    // App-specific metadata
    playCount: {
        type: Number,
        default: 0
    },
    
    lastPlayed: {
        type: Date
    },
    
    // User interactions
    likedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        likedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Audio features (if we want to store them)
    audioFeatures: {
        acousticness: Number,
        danceability: Number,
        energy: Number,
        instrumentalness: Number,
        key: Number,
        liveness: Number,
        loudness: Number,
        mode: Number,
        speechiness: Number,
        tempo: Number,
        timeSignature: Number,
        valence: Number
    }
}, {
    timestamps: true
});

// Indexes
trackSchema.index({ spotifyId: 1 });
trackSchema.index({ name: 'text', 'artists.name': 'text', 'album.name': 'text' });
trackSchema.index({ playCount: -1 });
trackSchema.index({ popularity: -1 });

module.exports = mongoose.model('Track', trackSchema);
