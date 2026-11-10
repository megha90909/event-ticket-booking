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

