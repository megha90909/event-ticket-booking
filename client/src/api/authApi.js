import api from "./axios";

export const loginUser = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

