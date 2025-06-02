// api.ts
import axios from "axios";
import { Tenant } from "./Tenants/Types"; // Correct import for the Tenant type

const API_URL = "http://localhost:8000/api/tenants"; // Update this URL as needed

export const getTenants = async () => {
  return await axios.get(API_URL);
};

export const createTenant = async (tenantData: Omit<Tenant, "id">) => {
  return await axios.post(API_URL, tenantData);
};

export const updateTenant = async (id: number, tenantData: Omit<Tenant, "id">) => {
  return await axios.put(`${API_URL}/${id}`, tenantData);
};

export const deleteTenant = async (id: number) => {
  return await axios.delete(`${API_URL}/${id}`);
};
