import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

// ─────────────────────────────
// TYPES
// ─────────────────────────────

export interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags?: string;
  views: number;
  helpful_count: number;
  author_id: number;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
}

export interface CreateArticleData {
  title: string;
  content: string;
  category: string;
  tags?: string;
}

// ─────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────

export const apiGetArticles = async () => {
  return (await client.get(`${API_PREFIX}/knowledge-base/articles`)).data;
};

export const apiGetArticle = async (id: number) => {
  return (await client.get(`${API_PREFIX}/knowledge-base/articles/${id}`)).data;
};

export const apiIncrementViews = async (id: number) => {
  return (await client.post(`${API_PREFIX}/knowledge-base/articles/${id}/views`)).data;
};

export const apiMarkHelpful = async (id: number) => {
  return (await client.post(`${API_PREFIX}/knowledge-base/articles/${id}/helpful`)).data;
};

// ─────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────

export const apiCreateArticle = async (data: CreateArticleData) => {
  return (await client.post(`${API_PREFIX}/knowledge-base/admin/articles`, data)).data;
};

export const apiUpdateArticle = async (id: number, data: Partial<CreateArticleData>) => {
  return (await client.put(`${API_PREFIX}/knowledge-base/admin/articles/${id}`, data)).data;
};

export const apiDeleteArticle = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/knowledge-base/admin/articles/${id}`)).data;
};

export const apiGetAllArticlesAdmin = async () => {
  return (await client.get(`${API_PREFIX}/knowledge-base/admin/articles`)).data;
};