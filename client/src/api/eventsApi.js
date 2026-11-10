import api from "./axios";

export const fetchEvents = async ({ search = "", category = "" } = {}) => {
  const params = {};
  if (search.trim()) {
    params.search = search.trim();
  }
  if (category.trim()) {
    params.category = category.trim();
  }

  const { data } = await api.get("/events", { params });
  return data.events;
};

export const fetchEventById = async (eventId) => {
  const { data } = await api.get(`/events/${eventId}`);
  return data.event;
};

export const createEvent = async (payload) => {
  const { data } = await api.post("/events", payload);
  return data.event;
};

export const updateEvent = async (eventId, payload) => {
  const { data } = await api.put(`/events/${eventId}`, payload);
  return data.event;
};

export const deleteEvent = async (eventId) => {
  const { data } = await api.delete(`/events/${eventId}`);
  return data;
};
