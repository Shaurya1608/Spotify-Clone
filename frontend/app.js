// Spotify Clone Frontend JavaScript

class SpotifyClone {
    constructor() {
        console.log('SpotifyClone constructor starting...');
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.currentTrack = null;
        this.audioElement = document.getElementById('audioElement');
        this.isPlaying = false;
        this.isShuffleOn = false;
        this.repeatMode = 'off';
        this.lastVolume = 0.5;
        
        console.log('Initializing elements...');
        this.initializeElements();
        console.log('Setting up event listeners...');
        this.setupEventListeners();
        console.log('Checking auth from URL...');
        this.checkAuthFromURL();
        console.log('Checking stored auth...');
        this.checkStoredAuth();
        console.log('SpotifyClone constructor completed!');
    }
    
    initializeElements() {
        // Auth elements
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userProfile = document.getElementById('userProfile');
        this.userAvatar = document.getElementById('userAvatar');
        this.userName = document.getElementById('userName');
        
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsTitle = document.getElementById('resultsTitle');
        
        // Playlist elements
        this.playlistsSection = document.getElementById('playlistsSection');
        this.playlistsContainer = document.getElementById('playlistsContainer');
        this.sidebarPlaylistsContainer = document.getElementById('sidebarPlaylistsContainer');
        
        // Welcome section
        this.welcomeSection = document.getElementById('welcomeSection');
        
        // Audio player elements
        this.nowPlayingBar = document.getElementById('nowPlayingBar');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentTrackImage = document.getElementById('currentTrackImage');
        this.currentTrackName = document.getElementById('currentTrackName');
        this.currentTrackArtist = document.getElementById('currentTrackArtist');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        
        // Utility elements
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.closeError = document.getElementById('closeError');
    }
    
    setupEventListeners() {
        // Auth event listeners
        this.loginBtn.addEventListener('click', () => this.login());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Search event listeners
        this.searchInput.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                this.performSearch();
            } else {
                this.showWelcomeSection();
            }
        });
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Navigation event listeners
        const backBtn = document.querySelector('.nav-btn:first-child');
        const forwardBtn = document.querySelector('.nav-btn:last-child');
        if (backBtn) backBtn.addEventListener('click', () => this.navigateBack());
        if (forwardBtn) forwardBtn.addEventListener('click', () => this.navigateForward());

        // Sidebar navigation event listeners
        this.setupSidebarNavigation();

        // Audio player event listeners
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('ended', () => this.onTrackEnded());
        this.audioElement.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.progressBar.addEventListener('click', (e) => this.seekTrack(e));
        
        // Additional player controls
        this.setupPlayerControls();
        
        // Error handling
        this.closeError.addEventListener('click', () => this.hideError());
    }
    
    // Authentication Methods
    login() {
        window.location.href = '/login';
    }
    
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        
        this.updateUIForLoggedOutState();
        this.showWelcomeSection();
    }
    
    checkAuthFromURL() {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const expiresIn = params.get('expires_in');
        
        if (accessToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.tokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);
            
            // Store tokens
            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.setItem('spotify_refresh_token', refreshToken);
            localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
            
            // Clean URL
            window.history.replaceState({}, document.title, '/');
            
            this.onAuthSuccess();
        }
    }
    
    checkStoredAuth() {
        const storedToken = localStorage.getItem('spotify_access_token');
        const storedRefresh = localStorage.getItem('spotify_refresh_token');
        const storedExpiry = localStorage.getItem('spotify_token_expiry');
        
        if (storedToken && storedExpiry) {
            const expiry = parseInt(storedExpiry);
            
            if (Date.now() < expiry) {
                this.accessToken = storedToken;
                this.refreshToken = storedRefresh;
                this.tokenExpiry = expiry;
                this.onAuthSuccess();
            } else if (storedRefresh) {
                this.refreshAccessToken();
            }
        }
    }
    
    async refreshAccessToken() {
        if (!this.refreshToken) return;
        
        try {
            const response = await fetch('/refresh_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.access_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
                
                localStorage.setItem('spotify_access_token', this.accessToken);
                localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
                
                this.onAuthSuccess();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
    }
    
    async onAuthSuccess() {
        this.updateUIForLoggedInState();
        this.hideWelcomeSection();
        await this.loadUserProfile();
        await this.loadUserPlaylists();
    }
    
    // API Methods
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }
        
        // Check if token needs refresh
        if (Date.now() >= this.tokenExpiry - 60000) { // Refresh 1 minute before expiry
            await this.refreshAccessToken();
        }
        
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            ...options.headers
        };
        
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            // Token invalid, try refresh
            await this.refreshAccessToken();
            const retryResponse = await fetch(url, { 
                ...options, 
                headers: { ...headers, 'Authorization': `Bearer ${this.accessToken}` }
            });
            return retryResponse;
        }
        
        return response;
    }
    
    async loadUserProfile() {
        try {
            const response = await this.makeAuthenticatedRequest('/me');
            if (response.ok) {
                const user = await response.json();
                this.updateUserProfile(user);
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }
    
    async loadUserPlaylists() {
        try {
            this.showLoading();
            
            // Cache playlists for 5 minutes to avoid repeated API calls
            const cacheKey = 'spotify_playlists_cache';
            const cacheTime = 5 * 60 * 1000; // 5 minutes
            const cached = localStorage.getItem(cacheKey);
            const cacheTimestamp = localStorage.getItem(cacheKey + '_time');
            
            if (cached && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < cacheTime) {
                console.log('Using cached playlists');
                const data = JSON.parse(cached);
                this.displayPlaylists(data.items);
                return;
            }
            
            // Reduce limit for faster loading and add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await this.makeAuthenticatedRequest('/playlists?limit=6', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                
                // Cache the results
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(cacheKey + '_time', Date.now().toString());
                
                this.displayPlaylists(data.items);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Playlist loading timed out');
                this.showError('Playlist loading is taking too long. Please check your connection.');
            } else {
                console.error('Failed to load playlists:', error);
                this.showError('Failed to load your playlists');
            }
        } finally {
            this.hideLoading();
        }
    }
    
    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;
        
        if (!this.accessToken) {
            this.showError('Please login to search');
            return;
        }
        
        try {
            this.showLoading();
            const response = await this.makeAuthenticatedRequest(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`);
            
            if (response.ok) {
                const data = await response.json();
                this.displaySearchResults(data.tracks.items, query);
            } else {
                this.showError('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    // UI Update Methods
    updateUIForLoggedInState() {
        this.loginBtn.style.display = 'none';
        this.userProfile.classList.remove('hidden');
    }
    
    updateUIForLoggedOutState() {
        this.loginBtn.style.display = 'flex';
        this.userProfile.classList.add('hidden');
        this.playlistsSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
    }
    
    updateUserProfile(user) {
        this.userName.textContent = user.display_name || 'Spotify User';
        if (user.images && user.images.length > 0) {
            this.userAvatar.src = user.images[0].url;
        }
    }
    
    showWelcomeSection() {
        this.welcomeSection.classList.remove('hidden');
        this.resultsSection.classList.add('hidden');
        this.playlistsSection.classList.add('hidden');
    }
    
    hideWelcomeSection() {
        this.welcomeSection.classList.add('hidden');
    }
    
    displayPlaylists(playlists) {
        // Clear both containers
        this.playlistsContainer.innerHTML = '';
        this.sidebarPlaylistsContainer.innerHTML = '';
        
        if (playlists.length === 0) {
            this.playlistsContainer.innerHTML = '<p style="color: #b3b3b3; text-align: center; padding: 32px;">No playlists found.</p>';
            return;
        }
        
        // Display in main content area
        playlists.forEach(playlist => {
            const playlistCard = this.createPlaylistCard(playlist);
            this.playlistsContainer.appendChild(playlistCard);
        });
        
        // Display in sidebar
        playlists.forEach(playlist => {
            const sidebarItem = this.createSidebarPlaylistItem(playlist);
            this.sidebarPlaylistsContainer.appendChild(sidebarItem);
        });
        
        this.playlistsSection.classList.remove('hidden');
    }
    
    displaySearchResults(tracks, query) {
        this.resultsContainer.innerHTML = '';
        this.resultsTitle.textContent = `Search Results for "${query}"`;
        
        if (tracks.length === 0) {
            this.resultsContainer.innerHTML = '<p>No tracks found. Try a different search term.</p>';
            this.resultsSection.classList.remove('hidden');
            return;
        }
        
        tracks.forEach(track => {
            const trackCard = this.createTrackCard(track);
            this.resultsContainer.appendChild(trackCard);
        });
        
        this.resultsSection.classList.remove('hidden');
    }
    
    createTrackCard(track) {
        const card = document.createElement('div');
        card.className = 'track-card';
        
        const imageUrl = track.album.images.length > 0 ? track.album.images[0].url : '';
        const artistNames = track.artists.map(artist => artist.name).join(', ');
        const hasPreview = track.preview_url !== null;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${track.name}" class="track-image" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23282828\"/><text x=\"50%\" y=\"50%\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23b3b3b3\" font-size=\"12\">No Image</text></svg>'">
            <div class="track-name">${track.name}</div>
            <div class="track-artist">${artistNames}</div>
            <button class="play-preview-btn" ${hasPreview ? '' : 'disabled'}>
                <i class="${hasPreview ? 'ri-play-fill' : 'ri-forbid-line'}"></i>
            </button>
        `;
        
        if (hasPreview) {
            const playBtn = card.querySelector('.play-preview-btn');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playTrackPreview(track);
            });
        }
        
        return card;
    }
    
    createPlaylistCard(playlist) {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        
        const imageUrl = playlist.images.length > 0 ? playlist.images[0].url : '';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${playlist.name}" class="playlist-image"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23282828\"/><text x=\"50%\" y=\"50%\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23b3b3b3\" font-size=\"12\">Playlist</text></svg>'">
            <div class="playlist-name">${playlist.name}</div>
            <div class="playlist-description">${playlist.description || `${playlist.tracks.total} tracks`}</div>
        `;
        
        // Add click handler to open playlist
        card.addEventListener('click', () => {
            this.openPlaylist(playlist);
        });
        
        return card;
    }
    
    createSidebarPlaylistItem(playlist) {
        const item = document.createElement('div');
        item.className = 'sidebar-playlist-item';
        item.textContent = playlist.name;
        
        // Add click handler to sidebar playlists too
        item.addEventListener('click', () => {
            this.openPlaylist(playlist);
        });
        
        return item;
    }
    
    async openPlaylist(playlist) {
        console.log('Opening playlist:', playlist.name);
        
        if (!this.accessToken) {
            this.showError('Please log in to view playlist tracks');
            return;
        }
        
        try {
            this.showLoading();
            
            // Fetch playlist tracks from Spotify API
            const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const allTracks = data.items.map(item => item.track).filter(track => track);
                const playableTracks = allTracks.filter(track => track.preview_url);
                
                if (allTracks.length > 0) {
                    // Display all tracks, both playable and non-playable
                    this.displaySearchResults(allTracks, `${playlist.name} playlist`);
                    
                    if (playableTracks.length > 0) {
                        this.resultsTitle.textContent = `${playlist.name} (${playableTracks.length}/${allTracks.length} tracks have previews)`;
                    } else {
                        this.resultsTitle.textContent = `${playlist.name} (${allTracks.length} tracks - no previews available)`;
                    }
                } else {
                    this.showError(`No tracks found in "${playlist.name}".`);
                }
            } else {
                const error = await response.text();
                this.showError(`Failed to load playlist: ${error}`);
            }
            
        } catch (error) {
            console.error('Error opening playlist:', error);
            this.showError('Failed to load playlist tracks');
        } finally {
            this.hideLoading();
        }
    }
    
    // Audio Player Methods
    playTrackPreview(track) {
        if (!track.preview_url) return;
        
        this.currentTrack = track;
        this.audioElement.src = track.preview_url;
        this.audioElement.play();
        this.isPlaying = true;
        
        this.updatePlayerUI(track);
        this.updatePlayPauseButton();
        this.showNowPlayingBar();
    }
    
    togglePlayPause() {
        if (!this.audioElement.src) return;
        
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
        } else {
            this.audioElement.play();
            this.isPlaying = true;
        }
        
        this.updatePlayPauseButton();
    }
    
    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'ri-pause-circle-fill';
        } else {
            icon.className = 'ri-play-circle-fill';
        }
    }
    
    updatePlayerUI(track) {
        const imageUrl = track.album.images.length > 0 ? track.album.images[1]?.url || track.album.images[0].url : '';
        const artistNames = track.artists.map(artist => artist.name).join(', ');
        
        this.currentTrackImage.src = imageUrl;
        this.currentTrackName.textContent = track.name;
        this.currentTrackArtist.textContent = artistNames;
    }
    
    updateProgress() {
        if (!this.audioElement.duration) return;
        
        const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        this.currentTime.textContent = this.formatTime(this.audioElement.currentTime);
    }
    
    onMetadataLoaded() {
        this.totalTime.textContent = this.formatTime(this.audioElement.duration);
    }
    
    onTrackEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.progressFill.style.width = '0%';
        this.currentTime.textContent = '0:00';
    }
    
    seekTrack(event) {
        if (!this.audioElement.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const seekTime = percent * this.audioElement.duration;
        
        this.audioElement.currentTime = seekTime;
    }
    
    showNowPlayingBar() {
        this.nowPlayingBar.classList.remove('hidden');
    }
    
    // Add navigation methods
    previousTrack() {
        // Implementation for previous track
        console.log('Previous track clicked');
    }
    
    nextTrack() {
        // Implementation for next track  
        console.log('Next track clicked');
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Utility Methods
    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideError(), 5000);
    }
    
    hideError() {
        this.errorMessage.classList.add('hidden');
    }
    
    // Navigation Methods
    navigateBack() {
        window.history.back();
        console.log('Navigate back clicked');
    }
    
    navigateForward() {
        window.history.forward();
        console.log('Navigate forward clicked');
    }
    
    // Sidebar Navigation Setup
    setupSidebarNavigation() {
        // Home button
        const homeBtn = document.querySelector('.sidebar-nav-item:first-child');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => this.showHome());
        }
        
        // Search button
        const searchBtn = document.querySelector('.sidebar-nav-item:nth-child(2)');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.focusSearch());
        }
        
        // Your Library button
        const libraryBtn = document.querySelector('.sidebar-nav-item:nth-child(3)');
        if (libraryBtn) {
            libraryBtn.addEventListener('click', () => this.showLibrary());
        }
        
        // Create Playlist button
        const createPlaylistBtn = document.querySelector('.create-item:first-child');
        if (createPlaylistBtn) {
            createPlaylistBtn.addEventListener('click', () => this.createNewPlaylist());
        }
        
        // Liked Songs button
        const likedSongsBtn = document.querySelector('.create-item:last-child');
        if (likedSongsBtn) {
            likedSongsBtn.addEventListener('click', () => this.showLikedSongs());
        }
    }
    
    // Player Controls Setup
    setupPlayerControls() {
        // Shuffle button
        const shuffleBtn = document.querySelector('.control-btn:first-child');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        
        // Repeat button
        const repeatBtn = document.querySelector('.control-btn:nth-child(5)');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }
        
        // Volume controls
        const volumeBtn = document.querySelector('.volume .control-btn');
        const volumeBar = document.querySelector('.volume-bar');
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        if (volumeBar) {
            volumeBar.addEventListener('click', (e) => this.setVolume(e));
        }
        
        // Fullscreen button
        const fullscreenBtn = document.querySelector('.fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    }
    
    // Navigation Actions
    showHome() {
        console.log('Home clicked');
        this.hideAllSections();
        this.showWelcomeSection();
        if (this.accessToken) {
            this.loadUserPlaylists();
        }
    }
    
    focusSearch() {
        console.log('Search clicked');
        this.searchInput.focus();
        this.searchInput.select();
    }
    
    showLibrary() {
        console.log('Library clicked');
        if (!this.accessToken) {
            this.showError('Please log in to view your library');
            return;
        }
        this.hideAllSections();
        this.loadUserPlaylists();
    }
    
    createNewPlaylist() {
        console.log('Create Playlist clicked');
        if (!this.accessToken) {
            this.showError('Please log in to create playlists');
            return;
        }
        
        const playlistName = prompt('Enter playlist name:');
        if (playlistName) {
            this.createPlaylist(playlistName);
        }
    }
    
    showLikedSongs() {
        console.log('Liked Songs clicked');
        if (!this.accessToken) {
            this.showError('Please log in to view liked songs');
            return;
        }
        this.loadLikedSongs();
    }
    
    // Player Control Actions
    toggleShuffle() {
        this.isShuffleOn = !this.isShuffleOn;
        const shuffleBtn = document.querySelector('.control-btn:first-child');
        if (shuffleBtn) {
            shuffleBtn.style.color = this.isShuffleOn ? '#1db954' : '#b3b3b3';
        }
        console.log('Shuffle:', this.isShuffleOn ? 'ON' : 'OFF');
    }
    
    toggleRepeat() {
        // Cycle through: off -> repeat all -> repeat one -> off
        if (!this.repeatMode) this.repeatMode = 'off';
        
        const modes = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        const repeatBtn = document.querySelector('.control-btn:nth-child(5)');
        if (repeatBtn) {
            const icon = repeatBtn.querySelector('i');
            switch(this.repeatMode) {
                case 'off':
                    repeatBtn.style.color = '#b3b3b3';
                    icon.className = 'ri-repeat-line';
                    break;
                case 'all':
                    repeatBtn.style.color = '#1db954';
                    icon.className = 'ri-repeat-line';
                    break;
                case 'one':
                    repeatBtn.style.color = '#1db954';
                    icon.className = 'ri-repeat-one-line';
                    break;
            }
        }
        console.log('Repeat mode:', this.repeatMode);
    }
    
    toggleMute() {
        if (this.audioElement.muted) {
            this.audioElement.muted = false;
            this.audioElement.volume = this.lastVolume || 0.5;
        } else {
            this.lastVolume = this.audioElement.volume;
            this.audioElement.muted = true;
            this.audioElement.volume = 0;
        }
        this.updateVolumeUI();
        console.log('Mute toggled:', this.audioElement.muted);
    }
    
    setVolume(e) {
        const volumeBar = e.currentTarget;
        const rect = volumeBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audioElement.volume = Math.max(0, Math.min(1, percent));
        this.audioElement.muted = false;
        this.updateVolumeUI();
    }
    
    updateVolumeUI() {
        const volumeFill = document.querySelector('.volume-fill');
        const volumeIcon = document.querySelector('.volume i');
        
        if (volumeFill) {
            volumeFill.style.width = `${this.audioElement.volume * 100}%`;
        }
        
        if (volumeIcon) {
            if (this.audioElement.muted || this.audioElement.volume === 0) {
                volumeIcon.className = 'ri-volume-mute-line';
            } else if (this.audioElement.volume < 0.5) {
                volumeIcon.className = 'ri-volume-down-line';
            } else {
                volumeIcon.className = 'ri-volume-up-line';
            }
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        console.log('Fullscreen toggled');
    }
    
    // Helper Methods
    hideAllSections() {
        this.welcomeSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
        this.playlistsSection.classList.add('hidden');
    }
    
    async createPlaylist(name) {
        // This would create a custom playlist in your database
        console.log('Creating playlist:', name);
        this.showError('Playlist creation will be available once MongoDB is fully integrated!');
    }
    
    async loadLikedSongs() {
        // This would load liked songs from your database
        console.log('Loading liked songs...');
        this.showError('Liked songs will be available once MongoDB is fully integrated!');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Spotify Clone...');
    try {
        const app = new SpotifyClone();
        console.log('Spotify Clone initialized successfully!');
        window.spotifyApp = app; // Make available globally for debugging
    } catch (error) {
        console.error('Error initializing Spotify Clone:', error);
    }
});
