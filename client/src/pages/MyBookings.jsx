import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { fetchMyBookings } from "../api/bookingsApi";
import { BookingsListSkeleton } from "../components/LoadingSkeleton";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  getErrorMessage,
} from "../utils/format";
import "./MyBookings.css";

function BookingItem({ booking }) {
  const [imageError, setImageError] = useState(false);
  const event = booking.event;
  const showImage = Boolean(event?.imageUrl) && !imageError;
  const isCancelled = booking.status === "cancelled";
  const bookingId = String(booking._id);

  return (
    <article className="booking-item">
      <div className="booking-item-media">
        {showImage ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="booking-item-placeholder" aria-hidden="true">
            <span>{event?.category || "Event"}</span>
          </div>
        )}
      </div>

      <div className="booking-item-body">
        <div className="booking-item-top">
          <div className="booking-item-badges">
            {event?.category && (
              <span className="badge badge-primary">{event.category}</span>
            )}
            <span
              className={`badge ${
                isCancelled ? "badge-danger" : "badge-success"
              }`}
            >
              {booking.status}
            </span>
          </div>
          <span className="booking-booked-on">
            Booked on {formatDate(booking.createdAt)}
          </span>
        </div>

        <h2 className="booking-item-title">
          {event ? (
            <Link to={`/events/${event._id}`}>{event.title}</Link>
          ) : (
            "Event no longer available"
          )}
        </h2>

        {event && (
          <div className="booking-item-meta">
            <span>{formatDateTime(event.date)}</span>
            <span>&bull;</span>
            <span>{event.venue}</span>
          </div>
        )}

        <div className="booking-item-summary">
          <div>
            <span className="summary-label">Tickets</span>
            <strong>{booking.quantity}</strong>
          </div>
          <div>
            <span className="summary-label">Total Paid</span>
            <strong>{formatPrice(booking.totalPrice)}</strong>
          </div>
          {event && (
            <Link
              to={`/events/${event._id}`}
              className="btn btn-secondary btn-sm booking-view-link"
            >
              View Event
            </Link>
          )}
        </div>
      </div>

      <div className={`booking-item-qr ${isCancelled ? "is-cancelled" : ""}`}>
        <div className="booking-qr-frame">
          <QRCodeSVG
            value={bookingId}
            size={96}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#0f172a"
            title={`Booking QR code for ${bookingId}`}
          />
        </div>
        <span className="booking-qr-label">
          {isCancelled ? "Cancelled Ticket" : "Entry QR Pass"}
        </span>
        <code className="booking-qr-id" title={bookingId}>
          {bookingId}
        </code>
      </div>
    </article>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your bookings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <section className="bookings-page">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p>
          View your upcoming tickets, booking confirmations, and entry QR
          passes.
        </p>
      </div>

      {loading ? (
        <BookingsListSkeleton count={3} />
      ) : error ? (
        <div className="state-box">
          <div className="alert alert-error" role="alert">
            {error}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadBookings}
          >
            Try Again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="state-box">
          <h3>No bookings yet</h3>
          <p>
            You haven&apos;t booked any tickets yet. Explore upcoming events to
            reserve your spot.
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <BookingItem key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </section>
  );
}
