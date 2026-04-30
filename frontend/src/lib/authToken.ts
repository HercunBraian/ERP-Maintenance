let accessToken: string | null = null;

// 🔥 guardar token
export function setAccessToken(token: string | null) {
  accessToken = token;
}

// 🔥 obtener token (usado por api.ts)
export function getAccessToken(): string | null {
  return accessToken;
}