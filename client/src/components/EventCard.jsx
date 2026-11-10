import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime, formatPrice } from "../utils/format";
import "./EventCard.css";

export default function EventCard({ event }) {
  const [imageError, setImageError] = useState(false);

  const showImage = Boolean(event.imageUrl) && !imageError;
  const isSoldOut = event.availableTickets === 0;
  const isLowStock = event.availableTickets > 0 && event.availableTickets <= 5;

  return (
    <article className="event-card">
      <Link to={`/events/${event._id}`} className="event-card-media">
        {showImage ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="event-card-image"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="event-card-placeholder" aria-hidden="true">
            <span>{event.category || "Event"}</span>
          </div>
        )}
        <span className="badge badge-primary event-card-category">
          {event.category}
        </span>
      </Link>

      <div className="event-card-body">
        <div className="event-card-meta-row">
          <span className="event-card-date">{formatDateTime(event.date)}</span>
          {isSoldOut ? (
            <span className="badge badge-danger">Sold Out</span>
          ) : isLowStock ? (
            <span className="badge badge-warning">
              Only {event.availableTickets} left
            </span>
          ) : (
            <span className="badge badge-success">
              {event.availableTickets} left
            </span>
          )}
        </div>

        <h3 className="event-card-title">
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>

        <p className="event-card-venue">{event.venue}</p>

        <div className="event-card-footer">
          <span className="event-card-price">{formatPrice(event.price)}</span>
          <Link to={`/events/${event._id}`} className="btn btn-secondary btn-sm">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

