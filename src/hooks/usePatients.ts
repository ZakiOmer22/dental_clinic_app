import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetPatients, apiCreatePatient, apiUpdatePatient, apiDeletePatient } from "@/api/patients";
import toast from "react-hot-toast";

export function usePatients(params?: any) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => apiGetPatients(params),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiCreatePatient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient saved");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to save"),
  });
}

export function useUpdatePatient(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiUpdatePatient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
      toast.success("Patient updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to update"),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiDeletePatient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient deleted");
    },
  });
}
