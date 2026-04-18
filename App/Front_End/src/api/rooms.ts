import client from "./client";

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
  const res = await client.get("/rooms");
  return res.data;
};

// GET one room
export const apiGetRoomById = async (id: number): Promise<Room> => {
  const res = await client.get(`/rooms/${id}`);
  return res.data;
};

// CREATE room
export const apiCreateRoom = async (data: CreateRoomData): Promise<Room> => {
  const res = await client.post("/rooms", data);
  return res.data;
};

// UPDATE room
export const apiUpdateRoom = async (
  id: number,
  data: UpdateRoomData
): Promise<Room> => {
  const res = await client.put(`/rooms/${id}`, data);
  return res.data;
};

// DELETE room
export const apiDeleteRoom = async (id: number): Promise<void> => {
  await client.delete(`/rooms/${id}`);
};