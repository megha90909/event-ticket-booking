import api from "./axios";

export const createBooking = async ({ eventId, quantity }) => {
  const { data } = await api.post("/bookings", { eventId, quantity });
  return data.booking;
};

export const fetchMyBookings = async () => {
  const { data } = await api.get("/bookings/my");
  return data.bookings;
};

