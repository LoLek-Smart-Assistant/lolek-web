import axiosInstance from '../config/axiosConfig';

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
  user: {
    id: string;
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
   * Refresh access token using refresh cookie
   */
  refresh: () => {
    return axiosInstance.post<AuthResponse>('/authentication/refresh');
  },

  /**
   * Initialize authentication by checking if user is already logged in (via cookies)
   * Returns user data if authenticated, null if not
   */
  initializeAuth: async () => {
    try {
      const response = await authService.refresh();
      return response.data.user;
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
