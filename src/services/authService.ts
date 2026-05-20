import axiosInstance from '../config/axiosConfig';
import userService from './userService';

export interface SignInRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    _id: string;
    username: string;
    email: string;
    riotName?: string;
    riotTag?: string;
    puuid?: string;
    platform?: string;
  };
}

const authService = {
  /**
   * Create a new user account
   */
  signIn: (data: SignInRequest) => {
    return axiosInstance.post<AuthResponse>('/authentication/sign-in', data);
  },

  /**
   * Login with email and password
   */
  logIn: (data: LoginRequest) => {
    return axiosInstance.post<AuthResponse>('/authentication/log-in', data);
  },

  /**
   * Logout current user
   */
  logOut: () => {
    return axiosInstance.post('/authentication/log-out');
  },

  /**
   * Store tokens in localStorage
   */
  setTokens: (token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  },

  /**
   * Get stored token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Clear stored tokens
   */
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Initialize authentication by checking if user is already logged in (via cookies)
   * Returns user data if authenticated, null if not
   */
  initializeAuth: async () => {
    try {
      const response = await userService.getProfile();
      return response.data;
    } catch (error: any) {
      // 401 is expected when user is not logged in - return null silently
      if (error.response?.status === 401) {
        return null
      }
      // For other errors, log them
      console.error('Auth initialization error:', error)
      return null;
    }
  },
};

export default authService;
