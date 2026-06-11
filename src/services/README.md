# API Services Documentation

This directory contains all the API service modules for communicating with the LoLek backend API.

## Setup

### 1. Configure Base URL

Create a `.env` file in the root directory (copy from `.env.example`):

```env
VITE_API_URL=http://localhost:3000
```

### 2. Import Services

```typescript
import { authService, userService, summonerService, syncService } from '@/services';
```

## Available Services

### Authentication Service (`authService`)

Handle user authentication:

```typescript
// Sign up
const response = await authService.signIn({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'password123'
});

// Login
const response = await authService.logIn({
  email: 'john@example.com',
  password: 'password123'
});

// Logout
await authService.logOut();
```

### User Service (`userService`)

Manage user profiles and Riot account linking:

```typescript
// Get current user profile
const profile = await userService.getProfile();
console.log(profile.data.username);

// Get Riot profile data
const riotProfile = await userService.getRiotProfile();

// Link Riot account
await userService.linkRiotProfile({
  riotName: 'PlayerName',
  riotTag: 'NA1',
  platform: 'NA1'
});
```

### Summoner Service (`summonerService`)

Get League of Legends summoner information:

```typescript
// Get account by game name and tag
const account = await summonerService.getAccount('PlayerName', 'NA1');
console.log(account.data.puuid);

// Get live game data
const liveGame = await summonerService.getLiveGame('NA1', 'encrypted_summoner_id');
console.log(liveGame.data.participants);
```

### Sync Service (`syncService`)

Synchronize game data:

```typescript
// Sync champions and items data
const syncResult = await syncService.syncData();
```

## Error Handling

The axios instance includes automatic error handling:

- **401 Unauthorized**: Propagates the error to the UI
- **Timeouts**: Requests timeout after 10 seconds
- **Network errors**: Logged to console in development

Example:

```typescript
try {
  const response = await authService.logIn({
    email: 'user@example.com',
    password: 'password'
  });
} catch (error) {
  console.error('Login failed:', error);
  // Handle error appropriately
}
```

## Authentication Flow

Authentication uses httpOnly cookies:

1. Login/register sets a secure httpOnly cookie from the API
2. Requests include cookies automatically via `withCredentials`
3. If 401 response received, the UI can prompt for login

## Development

### Base URL
- Development: `http://localhost:3000` (from `.env.example`)
- Custom: Set `VITE_API_URL` environment variable

### Adding New Endpoints

1. Create a new service file in `src/services/`
2. Export interfaces and service object
3. Add exports to `src/services/index.ts`

Example:

```typescript
// src/services/newService.ts
import axiosInstance from '../config/axiosConfig';

const newService = {
  getExample: () => {
    return axiosInstance.get('/endpoint');
  },
};

export default newService;
```

Then add to `index.ts`:

```typescript
export { default as newService } from './newService';
```
