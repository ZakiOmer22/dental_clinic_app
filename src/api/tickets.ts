// ─────────────────────────────────────────────────────────────
// src/api/tickets.ts - Support Tickets API Client
// ─────────────────────────────────────────────────────────────

import client from "./client";

export interface Ticket {
    id: number;
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_by: number;
    created_by_name?: string;
    assigned_to?: number | null;
    assigned_to_name?: string | null;
    created_at: string;
    updated_at: string;
    resolved_at?: string | null;
    comments?: TicketComment[];
}

export interface TicketComment {
    id: number;
    ticket_id: number;
    user_id: number;
    user_name?: string;
    comment: string;
    created_at: string;
}

export interface TicketResponse {
    data: Ticket[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateTicketData {
    subject: string;
    description: string;
    category: string;
    priority: string;
    createdBy?: number;
}

export interface UpdateTicketData {
    subject?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    assigned_to?: number | null;
}

export interface AddCommentData {
    comment: string;
    userId?: number;
}

/**
 * Get all tickets with optional filtering
 */
export const apiGetTickets = async (params?: {
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: number;
    created_by?: number;
    page?: number;
    limit?: number;
    search?: string;
}): Promise<TicketResponse> => {
    try {
        const res = await client.get("/tickets", { params });
        return res.data;
    } catch (error: any) {
        console.error('Error fetching tickets:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch tickets');
    }
};

/**
 * Get a single ticket by ID
 */
export const apiGetTicket = async (id: number): Promise<Ticket> => {
    try {
        const res = await client.get(`/tickets/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('Error fetching ticket:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch ticket');
    }
};

/**
 * Create a new ticket
 */
export const apiCreateTicket = async (data: CreateTicketData): Promise<Ticket> => {
    try {
        const res = await client.post("/tickets", data);
        return res.data;
    } catch (error: any) {
        console.error('Error creating ticket:', error);
        throw new Error(error.response?.data?.error || 'Failed to create ticket');
    }
};

/**
 * Update an existing ticket
 */
export const apiUpdateTicket = async (id: number, data: UpdateTicketData): Promise<Ticket> => {
    try {
        const res = await client.put(`/tickets/${id}`, data);
        return res.data;
    } catch (error: any) {
        console.error('Error updating ticket:', error);
        throw new Error(error.response?.data?.error || 'Failed to update ticket');
    }
};

/**
 * Delete a ticket
 */
export const apiDeleteTicket = async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await client.delete(`/tickets/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('Error deleting ticket:', error);
        throw new Error(error.response?.data?.error || 'Failed to delete ticket');
    }
};

/**
 * Add a comment to a ticket
 */
export const apiAddComment = async (ticketId: number, data: AddCommentData): Promise<TicketComment> => {
    try {
        const res = await client.post(`/tickets/${ticketId}/comments`, data);
        return res.data;
    } catch (error: any) {
        console.error('Error adding comment:', error);
        throw new Error(error.response?.data?.error || 'Failed to add comment');
    }
};

/**
 * Get comments for a ticket
 */
export const apiGetTicketComments = async (ticketId: number): Promise<TicketComment[]> => {
    try {
        const res = await client.get(`/tickets/${ticketId}/comments`);
        return res.data;
    } catch (error: any) {
        console.error('Error fetching comments:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch comments');
    }
};

/**
 * Delete a comment
 */
export const apiDeleteComment = async (ticketId: number, commentId: number): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await client.delete(`/tickets/${ticketId}/comments/${commentId}`);
        return res.data;
    } catch (error: any) {
        console.error('Error deleting comment:', error);
        throw new Error(error.response?.data?.error || 'Failed to delete comment');
    }
};

/**
 * Assign a ticket to a user
 */
export const apiAssignTicket = async (ticketId: number, userId: number): Promise<Ticket> => {
    try {
        const res = await client.post(`/tickets/${ticketId}/assign`, { userId });
        return res.data;
    } catch (error: any) {
        console.error('Error assigning ticket:', error);
        throw new Error(error.response?.data?.error || 'Failed to assign ticket');
    }
};

/**
 * Get ticket statistics
 */
export const apiGetTicketStats = async (): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    avgResponseTime: string;
    openTickets: number;
    resolvedToday: number;
}> => {
    try {
        const res = await client.get("/tickets/stats");
        return res.data;
    } catch (error: any) {
        console.error('Error fetching ticket stats:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch ticket stats');
    }
};

/**
 * Search tickets
 */
export const apiSearchTickets = async (query: string): Promise<Ticket[]> => {
    try {
        const res = await client.get("/tickets/search", { params: { q: query } });
        return res.data;
    } catch (error: any) {
        console.error('Error searching tickets:', error);
        throw new Error(error.response?.data?.error || 'Failed to search tickets');
    }
};