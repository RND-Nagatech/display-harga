const TOKEN_KEY = "pricetv:token";

export type AuthUser = {
  id: string;
  username: string;
  level: "admin" | "operator";
};

export function getToken(): string | null {
  try {
    return (
      window.localStorage.getItem(TOKEN_KEY) ||
      window.sessionStorage.getItem(TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function setToken(token: string, remember: boolean) {
  clearToken();
  try {
    (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

