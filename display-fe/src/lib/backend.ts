import { apiForm, apiJson } from "./api";

export type ApiResponse<T> = { data: T };

export type UserLevel = "admin" | "operator";

export type AuthUser = {
  id: string;
  username: string;
  level: UserLevel;
  isActive: boolean;
};

export type Item = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  isActive: boolean;
};

export type Media = {
  id: string;
  label: string;
  type: "file" | "youtube";
  url?: string;
  sourceUrl?: string;
  embedUrl?: string;
  durationSec?: number;
  isActive: boolean;
};

export type SystemSetting = {
  companyCode: string;
  companyName: string;
  address: string;
  phone: string;
};

export async function login(username: string, password: string) {
  return apiJson<ApiResponse<{ token: string; user: AuthUser }>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).then((r) => r.data);
}

export async function getMe() {
  return apiJson<ApiResponse<AuthUser>>("/auth/me").then((r) => r.data);
}

export async function listItems() {
  return apiJson<ApiResponse<Item[]>>("/items").then((r) => r.data);
}

export async function createItem(payload: Partial<Item>) {
  return apiJson<ApiResponse<Item>>("/items", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function updateItem(id: string, payload: Partial<Item>) {
  return apiJson<ApiResponse<Item>>(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deleteItem(id: string) {
  await apiJson<ApiResponse<null>>(`/items/${id}`, { method: "DELETE" });
}

export async function listMedia() {
  return apiJson<ApiResponse<Media[]>>("/media").then((r) => r.data);
}

export async function uploadMedia(label: string, file: File, isActive: boolean) {
  const form = new FormData();
  form.append("label", label);
  form.append("isActive", String(isActive));
  form.append("video", file);
  return apiForm<ApiResponse<Media>>("/media/upload", form).then((r) => r.data);
}

export async function createYoutubeMedia(label: string, url: string, durationSec: number, isActive: boolean) {
  return apiJson<ApiResponse<Media>>("/media/youtube", {
    method: "POST",
    body: JSON.stringify({ label, url, durationSec, isActive }),
  }).then((r) => r.data);
}

export async function updateMedia(id: string, payload: Partial<Media> & { url?: string }) {
  // backend accepts: label, isActive, durationSec, sourceUrl/url
  return apiJson<ApiResponse<Media>>(`/media/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deleteMedia(id: string) {
  await apiJson<ApiResponse<null>>(`/media/${id}`, { method: "DELETE" });
}

export async function listUsers() {
  return apiJson<ApiResponse<AuthUser[]>>("/users").then((r) => r.data);
}

export async function createUser(payload: { username: string; password: string; level: UserLevel; isActive: boolean }) {
  return apiJson<ApiResponse<AuthUser>>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function updateUser(id: string, payload: { username: string; password?: string; level: UserLevel; isActive: boolean }) {
  return apiJson<ApiResponse<AuthUser>>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deleteUser(id: string) {
  await apiJson<ApiResponse<null>>(`/users/${id}`, { method: "DELETE" });
}

export async function getSystem() {
  return apiJson<ApiResponse<SystemSetting>>("/system").then((r) => r.data);
}

export async function updateSystem(payload: SystemSetting) {
  return apiJson<ApiResponse<SystemSetting>>("/system", {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function getDisplay() {
  return apiJson<ApiResponse<{ items: Item[]; media: Media[]; system: SystemSetting }>>("/display").then((r) => r.data);
}

