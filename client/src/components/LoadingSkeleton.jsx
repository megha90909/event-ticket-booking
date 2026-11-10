/**
 * Accessible skeleton placeholders for loading states on events and bookings lists.
 */
export function EventsGridSkeleton({ count = 6 }) {
  return (
    <div
      className="events-grid"
      role="status"
      aria-live="polite"
      aria-label="Loading events"
    >
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="skeleton-card" aria-hidden="true">
          <div className="skeleton skeleton-media" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line is-short" />
            <div className="skeleton skeleton-line is-title" />
            <div className="skeleton skeleton-line is-medium" />
            <div className="skeleton skeleton-line is-short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookingsListSkeleton({ count = 3 }) {
  return (
    <div
      className="bookings-list"
      role="status"
      aria-live="polite"
      aria-label="Loading your bookings"
    >
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="booking-skeleton-card" aria-hidden="true">
          <div className="skeleton booking-skeleton-media" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line is-short" />
            <div className="skeleton skeleton-line is-title" />
            <div className="skeleton skeleton-line is-medium" />
            <div className="skeleton skeleton-line is-short" />
          </div>
        </div>
      ))}
    </div>
  );
}

