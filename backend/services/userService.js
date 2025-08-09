const User = require('../models/User');
const Track = require('../models/Track');

class UserService {
    // Create or update user from Spotify data
    static async createOrUpdateUser(spotifyUserData) {
        try {
            const userData = {
                spotifyId: spotifyUserData.id,
                displayName: spotifyUserData.display_name,
                email: spotifyUserData.email,
                profileImage: spotifyUserData.images?.[0]?.url,
                country: spotifyUserData.country,
                product: spotifyUserData.product
            };

            const user = await User.findOneAndUpdate(
                { spotifyId: spotifyUserData.id },
                userData,
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true
                }
            );

            return user;
        } catch (error) {
            throw new Error(`Failed to create/update user: ${error.message}`);
        }
    }

    // Get user by Spotify ID
    static async getUserBySpotifyId(spotifyId) {
        try {
            return await User.findOne({ spotifyId })
                .populate('customPlaylists')
                .populate('likedTracks');
        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    // Add track to recently played
    static async addToRecentlyPlayed(userId, trackId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Remove if already exists to avoid duplicates
            user.recentlyPlayed = user.recentlyPlayed.filter(
                item => item.track.toString() !== trackId.toString()
            );

            // Add to beginning
            user.recentlyPlayed.unshift({
                track: trackId,
                playedAt: new Date()
            });

            // Keep only last 50 tracks
            if (user.recentlyPlayed.length > 50) {
                user.recentlyPlayed = user.recentlyPlayed.slice(0, 50);
            }

            await user.save();
            return user.recentlyPlayed;
        } catch (error) {
            throw new Error(`Failed to add to recently played: ${error.message}`);
        }
    }

    // Toggle like for a track
    static async toggleLikeTrack(userId, trackId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const trackIndex = user.likedTracks.findIndex(
                id => id.toString() === trackId.toString()
            );

            let isLiked;
            if (trackIndex > -1) {
                // Unlike
                user.likedTracks.splice(trackIndex, 1);
                isLiked = false;
            } else {
                // Like
                user.likedTracks.push(trackId);
                isLiked = true;
            }

            await user.save();
            return { isLiked, totalLikes: user.likedTracks.length };
        } catch (error) {
            throw new Error(`Failed to toggle like: ${error.message}`);
        }
    }

    // Update user preferences
    static async updatePreferences(userId, preferences) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { preferences } },
                { new: true, runValidators: true }
            );

            if (!user) throw new Error('User not found');
            return user.preferences;
        } catch (error) {
            throw new Error(`Failed to update preferences: ${error.message}`);
        }
    }

    // Get user's listening stats
    static async getListeningStats(userId) {
        try {
            const user = await User.findById(userId)
                .populate('likedTracks')
                .populate({
                    path: 'recentlyPlayed.track',
                    model: 'Track'
                });

            if (!user) throw new Error('User not found');

            return {
                totalLikedTracks: user.likedTracks.length,
                recentlyPlayedCount: user.recentlyPlayed.length,
                customPlaylistsCount: user.customPlaylists.length
            };
        } catch (error) {
            throw new Error(`Failed to get listening stats: ${error.message}`);
        }
    }
}

module.exports = UserService;
