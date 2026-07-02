// FRONTEND/JS_&_JSON/api.js
const API_BASE = 'http://localhost:5000/api';

window.api = {
    // Getter to seamlessly retrieve the JWT token from storage
    get token() {
        return localStorage.getItem('token');
    },

    // Setter to manage token persistence across states
    set token(newToken) {
        if (newToken) {
            localStorage.setItem('token', newToken);
        } else {
            localStorage.removeItem('token');
        }
    },

    // Generates request headers dynamically with authorization tokens if present
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    },

    // Core Fetch Wrapper handling execution pipelines, token captures, and session safety
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                // FIX: Correctly merges default headers with any route-specific headers passed in options
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                },
            });

            // Handle 401 Unauthorized globally (Session Expiration / Tampered tokens)
            if (response.status === 401) {
                this.token = null;
                localStorage.removeItem('skillSwapLoggedIn');
                window.location.href = 'login.html';
                return { success: false, message: 'Session expired. Please login again.' };
            }

            // Fallback for unexpected non-JSON server returns
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return { success: false, message: 'Invalid server response signature.' };
            }

            const data = await response.json();

            // Automatically catch and store token if present on payload transitions
            if (data.token) {
                this.token = data.token;
            }

            return data;

        } catch (err) {
            console.error('API Request Error:', err);
            return {
                success: false,
                message: 'Network error. Please check your connection.'
            };
        }
    },

    // ==================== AUTH METHODS ====================
    
    async login(email, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    logout() {
        this.token = null;
        localStorage.clear();
        window.location.href = 'login.html';
    },

    async verifyOtp(email, otp) {
        return await this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp })
        });
    },

    async logoutServer() {
        return await this.request('/auth/logout', { method: 'POST' });
    },

    async resendOtp(email) {
        return await this.request('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    // ==================== USER METHODS ====================
    
    // Fetches profile schema details matching current logged-in session token
    async getCurrentUser() {
        if (!this.token) {
            return { success: false, message: 'Not logged in' };
        }
        return await this.request('/users/me');
    },

    // Fetches standard public card metrics for targeted users
    async getUserProfile(userId) {
        return await this.request(`/users/profile/${userId}`);
    },

    // Updates profile details (bio, location, photo representations)
    async updateProfile(profileData) {
        return await this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    // Simple validator method used by route guards to check current session validity
    isLoggedIn() {
        return !!this.token && !!localStorage.getItem('skillSwapLoggedIn');
    }
};