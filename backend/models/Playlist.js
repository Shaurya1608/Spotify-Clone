const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    // Basic playlist information
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    
    // Owner information
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Playlist settings
    public: {
        type: Boolean,
        default: true
    },
    collaborative: {
        type: Boolean,
        default: false
    },
    
    // Tracks in the playlist
    tracks: [{
        track: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Track',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Playlist image
    image: {
        type: String // URL to playlist cover image
    },
    
    // Followers
    followers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        followedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Metadata
    totalDuration: {
        type: Number, // in milliseconds
        default: 0
    },
    
    playCount: {
        type: Number,
        default: 0
    },
    
    lastPlayed: {
        type: Date
    },
    
    // Tags for categorization
    tags: [{
        type: String,
        trim: true
    }],
    
    // Mood/genre classification
    mood: {
        type: String,
        enum: ['happy', 'sad', 'energetic', 'calm', 'focus', 'party', 'workout', 'chill', 'other']
    }
}, {
    timestamps: true
});

// Virtual for track count
playlistSchema.virtual('trackCount').get(function() {
    return this.tracks.length;
});

// Virtual for follower count
playlistSchema.virtual('followerCount').get(function() {
    return this.followers.length;
});

// Indexes
playlistSchema.index({ owner: 1 });
playlistSchema.index({ name: 'text', description: 'text' });
playlistSchema.index({ public: 1 });
playlistSchema.index({ createdAt: -1 });
playlistSchema.index({ playCount: -1 });

// Methods
playlistSchema.methods.addTrack = function(trackId, userId) {
    // Check if track already exists
    const existingTrack = this.tracks.find(t => t.track.toString() === trackId.toString());
    if (existingTrack) {
        throw new Error('Track already exists in playlist');
    }
    
    this.tracks.push({
        track: trackId,
        addedBy: userId
    });
    
    return this.save();
};

playlistSchema.methods.removeTrack = function(trackId) {
    this.tracks = this.tracks.filter(t => t.track.toString() !== trackId.toString());
    return this.save();
};

playlistSchema.methods.isFollowedBy = function(userId) {
    return this.followers.some(f => f.user.toString() === userId.toString());
};

module.exports = mongoose.model('Playlist', playlistSchema);
