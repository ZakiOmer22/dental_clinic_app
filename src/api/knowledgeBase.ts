import client from "./client";

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
  const res = await client.get("/knowledge-base/articles");
  return res.data;
};

export const apiGetArticle = async (id: number) => {
  const res = await client.get(`/knowledge-base/articles/${id}`);
  return res.data;
};

export const apiIncrementViews = async (id: number) => {
  const res = await client.post(`/knowledge-base/articles/${id}/views`);
  return res.data;
};

export const apiMarkHelpful = async (id: number) => {
  const res = await client.post(`/knowledge-base/articles/${id}/helpful`);
  return res.data;
};

// ─────────────────────────────
// ADMIN ENDPOINTS (PROTECTED VIA JWT CLIENT)
// ─────────────────────────────

export const apiCreateArticle = async (data: CreateArticleData) => {
  const res = await client.post("/knowledge-base/admin/articles", data);
  return res.data;
};

export const apiUpdateArticle = async (id: number, data: Partial<CreateArticleData>) => {
  const res = await client.put(`/knowledge-base/admin/articles/${id}`, data);
  return res.data;
};

export const apiDeleteArticle = async (id: number) => {
  const res = await client.delete(`/knowledge-base/admin/articles/${id}`);
  return res.data;
};

export const apiGetAllArticlesAdmin = async () => {
  const res = await client.get("/knowledge-base/admin/articles");
  return res.data;
};