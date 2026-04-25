import client from "./client";

const API_PREFIX = import.meta.env.VITE_API_VERSION
  ? `/api/${import.meta.env.VITE_API_VERSION}`
  : "";

export interface Room {
  id: number;
  clinic_id: number;
  name: string;
  type:
    | "dental_chair"
    | "consultation"
    | "xray"
    | "surgery"
    | "lab"
    | "sterilization"
    | "waiting"
    | "storage"
    | "office";
  floor?: string;
  is_available: boolean;
  notes?: string;
  created_at?: string;
}

export interface CreateRoomData {
  name: string;
  type: Room["type"];
  floor?: string;
  notes?: string;
}

export interface UpdateRoomData {
  name?: string;
  type?: Room["type"];
  floor?: string;
  is_available?: boolean;
  notes?: string;
}

// GET all rooms
export const apiGetRooms = async (): Promise<Room[]> => {
  return (await client.get(`${API_PREFIX}/rooms`)).data;
};

// GET one room
export const apiGetRoomById = async (id: number): Promise<Room> => {
  return (await client.get(`${API_PREFIX}/rooms/${id}`)).data;
};

// CREATE room
export const apiCreateRoom = async (data: CreateRoomData): Promise<Room> => {
  return (await client.post(`${API_PREFIX}/rooms`, data)).data;
};

// UPDATE room
export const apiUpdateRoom = async (
  id: number,
  data: UpdateRoomData
): Promise<Room> => {
  return (await client.put(`${API_PREFIX}/rooms/${id}`, data)).data;
};

// DELETE room
export const apiDeleteRoom = async (id: number): Promise<void> => {
  await client.delete(`${API_PREFIX}/rooms/${id}`);
};