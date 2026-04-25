import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export const apiGetTickets = async (params?: any) => {
  return (await client.get(`${API_PREFIX}/tickets`, { params })).data;
};

export const apiGetTicket = async (id: number) => {
  return (await client.get(`${API_PREFIX}/tickets/${id}`)).data;
};

export const apiCreateTicket = async (data: any) => {
  return (await client.post(`${API_PREFIX}/tickets`, data)).data;
};

export const apiUpdateTicket = async (id: number, data: any) => {
  return (await client.put(`${API_PREFIX}/tickets/${id}`, data)).data;
};

export const apiDeleteTicket = async (id: number) => {
  return (await client.delete(`${API_PREFIX}/tickets/${id}`)).data;
};

export const apiAddComment = async (ticketId: number, data: any) => {
  return (await client.post(`${API_PREFIX}/tickets/${ticketId}/comments`, data)).data;
};

export const apiGetTicketComments = async (ticketId: number) => {
  return (await client.get(`${API_PREFIX}/tickets/${ticketId}/comments`)).data;
};

export const apiDeleteComment = async (ticketId: number, commentId: number) => {
  return (await client.delete(`${API_PREFIX}/tickets/${ticketId}/comments/${commentId}`)).data;
};

export const apiAssignTicket = async (ticketId: number, userId: number) => {
  return (await client.post(`${API_PREFIX}/tickets/${ticketId}/assign`, { userId })).data;
};

export const apiGetTicketStats = async () => {
  return (await client.get(`${API_PREFIX}/tickets/stats`)).data;
};

export const apiSearchTickets = async (query: string) => {
  return (await client.get(`${API_PREFIX}/tickets/search`, { params: { q: query } })).data;
};