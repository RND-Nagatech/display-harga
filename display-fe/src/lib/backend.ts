import { apiForm, apiJson } from "./api";

export type ApiResponse<T> = { data: T };

export type UserLevel = "owner" | "admin" | "operator";

export type AuthUser = {
  id: string;
  username: string;
  level: UserLevel;
  isActive: boolean;
};

export type Category = {
  id: string;
  code: string;
  name: string;
  price: number;
  buybackPrice: number;
  isActive: boolean;
};

export type Media = {
  id: string;
  label: string;
  type: "file" | "youtube" | "video" | "image" | "embed" | "promo" | "url";
  url?: string;
  sourceUrl?: string;
  embedUrl?: string;
  displayUrl?: string;
  sourceType?: string;
  description?: string;
  origin?: "promo" | "content" | "media";
  durationSec?: number;
  isActive: boolean;
};

export type ContentType = {
  id: string;
  jenis_konten: string;
};

export type Content = {
  id: string;
  judul_konten: string;
  jenis_konten: string;
  source_url: string;
  deskripsi: string;
  durasi_tampil?: number | null;
  source_type?: string;
  display_url?: string;
  isActive: boolean;
};

export type Promo = {
  id: string;
  judul_promo: string;
  deskripsi_promo: string;
  banner_opsional: string;
  media_opsional: string;
  source_type?: string;
  display_url?: string;
  isActive: boolean;
};

export type SystemSetting = {
  companyCode: string;
  companyName: string;
  address: string;
  phone: string;
  operationalDays: string;
  operationalHours: string;
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

export async function listCategories() {
  return apiJson<ApiResponse<Category[]>>("/categories").then((r) => r.data);
}

export async function createCategory(payload: Partial<Category>) {
  return apiJson<ApiResponse<Category>>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  return apiJson<ApiResponse<Category>>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deleteCategory(id: string) {
  await apiJson<ApiResponse<null>>(`/categories/${id}`, { method: "DELETE" });
}

export async function listContentTypes() {
  return apiJson<ApiResponse<ContentType[]>>("/content-types").then((r) => r.data);
}

export async function createContentType(payload: Partial<ContentType>) {
  return apiJson<ApiResponse<ContentType>>("/content-types", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function updateContentType(id: string, payload: Partial<ContentType>) {
  return apiJson<ApiResponse<ContentType>>(`/content-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deleteContentType(id: string) {
  await apiJson<ApiResponse<null>>(`/content-types/${id}`, { method: "DELETE" });
}

export async function listContents() {
  return apiJson<ApiResponse<Content[]>>("/contents").then((r) => r.data);
}

export async function createContent(payload: Partial<Content>) {
  return apiJson<ApiResponse<Content>>("/contents", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function updateContent(id: string, payload: Partial<Content>) {
  return apiJson<ApiResponse<Content>>(`/contents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deleteContent(id: string) {
  await apiJson<ApiResponse<null>>(`/contents/${id}`, { method: "DELETE" });
}

export async function listPromos() {
  return apiJson<ApiResponse<Promo[]>>("/promos").then((r) => r.data);
}

export async function createPromo(payload: Partial<Promo>) {
  return apiJson<ApiResponse<Promo>>("/promos", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function updatePromo(id: string, payload: Partial<Promo>) {
  return apiJson<ApiResponse<Promo>>(`/promos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((r) => r.data);
}

export async function deletePromo(id: string) {
  await apiJson<ApiResponse<null>>(`/promos/${id}`, { method: "DELETE" });
}

export async function uploadAsset(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiForm<ApiResponse<{ fileName: string; url: string }>>("/uploads", form).then((r) => r.data);
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
  return apiJson<ApiResponse<{ categories: Category[]; contents?: Content[]; promos?: Promo[]; media: Media[]; system: SystemSetting }>>("/display").then((r) => r.data);
}
