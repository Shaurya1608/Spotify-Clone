const Track = require('../models/Track');

class TrackService {
    // Create or update track from Spotify data
    static async createOrUpdateTrack(spotifyTrackData) {
        try {
            const trackData = {
                spotifyId: spotifyTrackData.id,
                name: spotifyTrackData.name,
                artists: spotifyTrackData.artists.map(artist => ({
                    id: artist.id,
                    name: artist.name
                })),
                album: {
                    id: spotifyTrackData.album.id,
                    name: spotifyTrackData.album.name,
                    images: spotifyTrackData.album.images
                },
                durationMs: spotifyTrackData.duration_ms,
                explicit: spotifyTrackData.explicit,
                previewUrl: spotifyTrackData.preview_url,
                popularity: spotifyTrackData.popularity,
                externalUrls: spotifyTrackData.external_urls
            };

            const track = await Track.findOneAndUpdate(
                { spotifyId: spotifyTrackData.id },
                trackData,
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true
                }
            );

            return track;
        } catch (error) {
            throw new Error(`Failed to create/update track: ${error.message}`);
        }
    }

    // Get track by Spotify ID
    static async getTrackBySpotifyId(spotifyId) {
        try {
            return await Track.findOne({ spotifyId });
        } catch (error) {
            throw new Error(`Failed to get track: ${error.message}`);
        }
    }

    // Increment play count
    static async incrementPlayCount(trackId) {
        try {
            const track = await Track.findByIdAndUpdate(
                trackId,
                { 
                    $inc: { playCount: 1 },
                    $set: { lastPlayed: new Date() }
                },
                { new: true }
            );

            return track;
        } catch (error) {
            throw new Error(`Failed to increment play count: ${error.message}`);
        }
    }

    // Search tracks in database
    static async searchTracks(query, limit = 20) {
        try {
            const tracks = await Track.find({
                $text: { $search: query }
            })
            .limit(limit)
            .sort({ popularity: -1, playCount: -1 });

            return tracks;
        } catch (error) {
            throw new Error(`Failed to search tracks: ${error.message}`);
        }
    }

    // Get popular tracks
    static async getPopularTracks(limit = 50) {
        try {
            return await Track.find()
                .sort({ popularity: -1, playCount: -1 })
                .limit(limit);
        } catch (error) {
            throw new Error(`Failed to get popular tracks: ${error.message}`);
        }
    }

    // Get tracks by artist
    static async getTracksByArtist(artistId, limit = 20) {
        try {
            return await Track.find({
                'artists.id': artistId
            })
            .sort({ popularity: -1 })
            .limit(limit);
        } catch (error) {
            throw new Error(`Failed to get tracks by artist: ${error.message}`);
        }
    }

    // Add user like to track
    static async addLike(trackId, userId) {
        try {
            const track = await Track.findById(trackId);
            if (!track) throw new Error('Track not found');

            // Check if already liked
            const existingLike = track.likedBy.find(
                like => like.user.toString() === userId.toString()
            );

            if (existingLike) {
                throw new Error('Track already liked');
            }

            track.likedBy.push({
                user: userId,
                likedAt: new Date()
            });

            await track.save();
            return track;
        } catch (error) {
            throw new Error(`Failed to add like: ${error.message}`);
        }
    }

    // Remove user like from track
    static async removeLike(trackId, userId) {
        try {
            const track = await Track.findById(trackId);
            if (!track) throw new Error('Track not found');

            track.likedBy = track.likedBy.filter(
                like => like.user.toString() !== userId.toString()
            );

            await track.save();
            return track;
        } catch (error) {
            throw new Error(`Failed to remove like: ${error.message}`);
        }
    }

    // Get track analytics
    static async getTrackAnalytics(trackId) {
        try {
            const track = await Track.findById(trackId)
                .populate('likedBy.user', 'displayName');

            if (!track) throw new Error('Track not found');

            return {
                playCount: track.playCount,
                likeCount: track.likedBy.length,
                lastPlayed: track.lastPlayed,
                popularity: track.popularity
            };
        } catch (error) {
            throw new Error(`Failed to get track analytics: ${error.message}`);
        }
    }
}

module.exports = TrackService;
