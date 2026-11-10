import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../api/bookingsApi";
import { fetchEventById } from "../api/eventsApi";
import { useAuth } from "../context/AuthContext";
import {
  formatDateTime,
  formatPrice,
  getErrorMessage,
} from "../utils/format";
import "./EventDetails.css";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fetched = await fetchEventById(id);
      setEvent(fetched);
      setImageError(false);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load event details."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setBookingError("");
    setBookingSuccess(null);
    setQuantity(1);
    loadEvent();
  }, [loadEvent]);

  if (loading) {
    return (
      <div className="state-box" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="state-box">
        <div className="alert alert-error">{error || "Event not found."}</div>
        <Link to="/" className="btn btn-secondary">
          Back to Events
        </Link>
      </div>
    );
  }

  const isSoldOut = event.availableTickets === 0;
  const maxQuantity = Math.max(1, event.availableTickets);
  const safeQuantity =
    typeof quantity === "number" && quantity >= 1
      ? Math.min(quantity, maxQuantity)
      : 1;
  const showImage = Boolean(event.imageUrl) && !imageError;

  const handleDecrease = () => {
    setQuantity((prev) => {
      const current = typeof prev === "number" ? prev : 1;
      return Math.max(1, current - 1);
    });
  };

  const handleIncrease = () => {
    setQuantity((prev) => {
      const current = typeof prev === "number" ? prev : 1;
      return Math.min(maxQuantity, current + 1);
    });
  };

  const handleQuantityChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setQuantity("");
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setQuantity(Math.max(1, Math.min(maxQuantity, parsed)));
    }
  };

  const handleQuantityBlur = () => {
    if (typeof quantity !== "number" || quantity < 1) {
      setQuantity(1);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess(null);

    try {
      const booking = await createBooking({
        eventId: event._id,
        quantity: safeQuantity,
      });
      setBookingSuccess(booking);
      setQuantity(1);

      // Refresh event inventory directly from the server
      const updatedEvent = await fetchEventById(event._id);
      setEvent(updatedEvent);
    } catch (err) {
      setBookingError(getErrorMessage(err, "Booking failed. Please try again."));
      // Sync remaining tickets if another buyer claimed stock concurrently
      try {
        const refreshed = await fetchEventById(event._id);
        setEvent(refreshed);
      } catch {
        // Keep the primary booking error visible if refresh also fails
      }
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <section className="event-details-page">
      <Link to="/" className="back-link">
        &larr; Back to Events
      </Link>

      <div className="event-details-layout">
        <div className="event-details-main">
          <div className="event-details-banner">
            {showImage ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="event-details-placeholder" aria-hidden="true">
                <span>{event.category || "Event"}</span>
              </div>
            )}
          </div>

          <div className="event-details-content">
            <div className="event-details-badges">
              <span className="badge badge-primary">{event.category}</span>
              {isSoldOut ? (
                <span className="badge badge-danger">Sold Out</span>
              ) : (
                <span className="badge badge-success">
                  {event.availableTickets} of {event.totalTickets} tickets
                  available
                </span>
              )}
            </div>

            <h1>{event.title}</h1>

            <div className="event-details-meta">
              <div className="meta-item">
                <span className="meta-label">Date &amp; Time</span>
                <span className="meta-value">{formatDateTime(event.date)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Venue</span>
                <span className="meta-value">{event.venue}</span>
              </div>
            </div>

            <div className="event-details-description">
              <h2>About this event</h2>
              <p>{event.description}</p>
            </div>
          </div>
        </div>

        <aside className="booking-card">
          <div className="booking-card-header">
            <span className="booking-price-label">Ticket Price</span>
            <span className="booking-price">{formatPrice(event.price)}</span>
          </div>

          <div className="booking-availability">
            <span>Remaining Tickets</span>
            <strong>{event.availableTickets}</strong>
          </div>

          {!isSoldOut && (
            <>
              <div className="form-group">
                <label htmlFor="ticket-quantity" className="form-label">
                  Quantity
                </label>
                <div className="quantity-selector">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleDecrease}
                    disabled={safeQuantity <= 1 || bookingLoading}
                    aria-label="Decrease ticket quantity"
                  >
                    &minus;
                  </button>
                  <input
                    id="ticket-quantity"
                    type="number"
                    className="qty-input"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    disabled={bookingLoading}
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleIncrease}
                    disabled={safeQuantity >= maxQuantity || bookingLoading}
                    aria-label="Increase ticket quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="booking-total">
                <span>Total</span>
                <strong>{formatPrice(event.price * safeQuantity)}</strong>
              </div>
            </>
          )}

          {bookingError && (
            <div className="alert alert-error" role="alert">
              {bookingError}
            </div>
          )}

          {bookingSuccess && (
            <div className="alert alert-success booking-success-box" role="status">
              <p>
                <strong>Booking confirmed!</strong> Reserved{" "}
                {bookingSuccess.quantity}{" "}
                {bookingSuccess.quantity === 1 ? "ticket" : "tickets"} (
                {formatPrice(bookingSuccess.totalPrice)}).
              </p>
              <Link to="/my-bookings" className="booking-success-link">
                View My Bookings &rarr;
              </Link>
            </div>
          )}

          {isSoldOut ? (
            <button type="button" className="btn btn-primary btn-block" disabled>
              Sold Out
            </button>
          ) : !isAuthenticated ? (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => navigate("/login", { state: { from: location } })}
            >
              Login to Book
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleBook}
              disabled={bookingLoading}
            >
              {bookingLoading
                ? "Booking..."
                : `Book ${safeQuantity} ${safeQuantity === 1 ? "Ticket" : "Tickets"}`}
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}

