// src/api/knowledgeBase.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Types
export interface KnowledgeArticle {
    id: number;
    title: string;
    content: string;
    category: string;
    tags: string;
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
    authorId?: number;
}

// ============================================================
// PUBLIC ENDPOINTS (Used by users)
// ============================================================

// Get all articles (public)
export const apiGetArticles = async (): Promise<{ data: KnowledgeArticle[]; total: number; success: boolean }> => {
    const response = await axios.get(`${API_BASE}/knowledge-base/articles`);
    return response.data;
};

// Get single article (public)
export const apiGetArticle = async (id: number): Promise<{ success: boolean; data: KnowledgeArticle }> => {
    const response = await axios.get(`${API_BASE}/knowledge-base/articles/${id}`);
    return response.data;
};

// Increment view count (public)
export const apiIncrementViews = async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE}/knowledge-base/articles/${id}/views`);
    return response.data;
};

// Mark as helpful (public)
export const apiMarkHelpful = async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE}/knowledge-base/articles/${id}/helpful`);
    return response.data;
};

// ============================================================
// ADMIN ENDPOINTS (Only for admin panel)
// ============================================================

// Create article (admin only)
export const apiCreateArticle = async (data: CreateArticleData): Promise<{ success: boolean; data: KnowledgeArticle }> => {
    const response = await axios.post(`${API_BASE}/knowledge-base/admin/articles`, data);
    return response.data;
};

// Update article (admin only)
export const apiUpdateArticle = async (id: number, data: Partial<CreateArticleData>): Promise<{ success: boolean; data: KnowledgeArticle }> => {
    const response = await axios.put(`${API_BASE}/knowledge-base/admin/articles/${id}`, data);
    return response.data;
};

// Delete article (admin only)
export const apiDeleteArticle = async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${API_BASE}/knowledge-base/admin/articles/${id}`);
    return response.data;
};

// Get all articles for admin (including unpublished)
export const apiGetAllArticlesAdmin = async (): Promise<{ data: KnowledgeArticle[]; total: number; success: boolean }> => {
    const response = await axios.get(`${API_BASE}/knowledge-base/admin/articles`);
    return response.data;
};