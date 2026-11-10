import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from "../api/eventsApi";
import {
  formatDateTime,
  formatPrice,
  getErrorMessage,
  isValidHttpUrl,
  toDateTimeLocalValue,
} from "../utils/format";
import "./Admin.css";

const CATEGORY_SUGGESTIONS = [
  "Music",
  "Tech",
  "Workshop",
  "Conference",
  "Comedy",
  "Sports",
  "Arts",
];

const EMPTY_FORM = {
  title: "",
  category: "",
  date: "",
  venue: "",
  price: "",
  totalTickets: "",
  imageUrl: "",
  description: "",
};

const sortByEventDate = (items) =>
  [...items].sort((a, b) => new Date(a.date) - new Date(b.date));

const validateEventForm = (values, soldTickets = 0) => {
  const errors = {};

  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.category.trim()) errors.category = "Category is required.";
  if (!values.venue.trim()) errors.venue = "Venue is required.";
  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  const parsedDate = values.date ? new Date(values.date) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    errors.date = "Please choose a valid event date and time.";
  }

  const parsedPrice =
    values.price === "" ? Number.NaN : Number(values.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    errors.price = "Price must be 0 or greater.";
  }

  const parsedTotal =
    values.totalTickets === "" ? Number.NaN : Number(values.totalTickets);
  if (!Number.isInteger(parsedTotal) || parsedTotal < 1) {
    errors.totalTickets = "Total tickets must be a whole number of at least 1.";
  } else if (parsedTotal < soldTickets) {
    errors.totalTickets = `Total tickets cannot be less than ${soldTickets} already sold ticket(s).`;
  }

  const trimmedImage = values.imageUrl.trim();
  if (trimmedImage && !isValidHttpUrl(trimmedImage)) {
    errors.imageUrl = "Image URL must start with http:// or https://.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, payload: null };
  }

  return {
    errors: {},
    payload: {
      title: values.title.trim(),
      category: values.category.trim(),
      date: parsedDate.toISOString(),
      venue: values.venue.trim(),
      price: parsedPrice,
      totalTickets: parsedTotal,
      imageUrl: trimmedImage,
      description: values.description.trim(),
    },
  };
};

export default function Admin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const formSectionRef = useRef(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const fetched = await fetchEvents();
      setEvents(sortByEventDate(fetched));
    } catch (err) {
      setLoadError(getErrorMessage(err, "Unable to load events."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const soldTicketsForEditing = editingEvent
    ? Math.max(0, editingEvent.totalTickets - editingEvent.availableTickets)
    : 0;

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) =>
      [event.title, event.category, event.venue]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [events, searchQuery]);

  const stats = useMemo(() => {
    const soldOutCount = events.filter((e) => e.availableTickets === 0).length;
    const totalRemaining = events.reduce(
      (sum, e) => sum + (e.availableTickets || 0),
      0
    );
    return {
      totalEvents: events.length,
      soldOutCount,
      totalRemaining,
    };
  }, [events]);

  const resetFormState = () => {
    setFormValues(EMPTY_FORM);
    setEditingEvent(null);
    setFieldErrors({});
    setSubmitError("");
  };

  const handleOpenCreate = () => {
    if (formOpen && !editingEvent) {
      setFormOpen(false);
      resetFormState();
      return;
    }
    resetFormState();
    setActionFeedback(null);
    setConfirmDeleteId(null);
    setFormOpen(true);
  };

  const handleStartEdit = (event) => {
    setEditingEvent(event);
    setFormValues({
      title: event.title || "",
      category: event.category || "",
      date: toDateTimeLocalValue(event.date),
      venue: event.venue || "",
      price: String(event.price ?? ""),
      totalTickets: String(event.totalTickets ?? ""),
      imageUrl: event.imageUrl || "",
      description: event.description || "",
    });
    setFieldErrors({});
    setSubmitError("");
    setActionFeedback(null);
    setConfirmDeleteId(null);
    setFormOpen(true);

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    resetFormState();
  };

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const { errors, payload } = validateEventForm(
      formValues,
      soldTicketsForEditing
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError("Please correct the highlighted fields before saving.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingEvent) {
        const updated = await updateEvent(editingEvent._id, payload);
        setEvents((prev) =>
          sortByEventDate(
            prev.map((item) => (item._id === updated._id ? updated : item))
          )
        );
        setActionFeedback({
          type: "success",
          message: `Updated "${updated.title}".`,
        });
      } else {
        const created = await createEvent(payload);
        setEvents((prev) => sortByEventDate([...prev, created]));
        setActionFeedback({
          type: "success",
          message: `Created "${created.title}".`,
        });
      }

      setFormOpen(false);
      resetFormState();
    } catch (err) {
      setSubmitError(
        getErrorMessage(
          err,
          editingEvent ? "Failed to update event." : "Failed to create event."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async (event) => {
    setDeletingId(event._id);
    setActionFeedback(null);
    try {
      await deleteEvent(event._id);
      setEvents((prev) => prev.filter((item) => item._id !== event._id));
      if (editingEvent?._id === event._id) {
        setFormOpen(false);
        resetFormState();
      }
      setConfirmDeleteId(null);
      setActionFeedback({
        type: "success",
        message: `Deleted "${event.title}".`,
      });
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: getErrorMessage(err, `Failed to delete "${event.title}".`),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const previewImageUrl = isValidHttpUrl(formValues.imageUrl)
    ? formValues.imageUrl.trim()
    : "";

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Create, edit, and manage live events across the platform.</p>
        </div>
        <button
          type="button"
          className={`btn ${formOpen && !editingEvent ? "btn-secondary" : "btn-primary"}`}
          onClick={handleOpenCreate}
        >
          {formOpen && !editingEvent ? "Close Form" : "+ Create Event"}
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Events</span>
          <strong>{stats.totalEvents}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Remaining Tickets</span>
          <strong>{stats.totalRemaining}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Sold Out Events</span>
          <strong>{stats.soldOutCount}</strong>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`alert alert-dismissible ${
            actionFeedback.type === "error" ? "alert-error" : "alert-success"
          }`}
          role={actionFeedback.type === "error" ? "alert" : "status"}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setActionFeedback(null)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      {formOpen && (
        <div className="admin-form-card" ref={formSectionRef}>
          <div className="admin-form-header">
            <div>
              <h2>
                {editingEvent
                  ? `Edit Event: ${editingEvent.title}`
                  : "Create New Event"}
              </h2>
              <p>
                {editingEvent
                  ? "Update event details. Remaining ticket inventory adjusts automatically based on sold tickets."
                  : "Fill in the details below to publish a new ticketed event."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCancelForm}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>

          {submitError && (
            <div className="alert alert-error" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-form" noValidate>
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="event-title" className="form-label">
                  Title *
                </label>
                <input
                  id="event-title"
                  type="text"
                  className={`form-input ${fieldErrors.title ? "is-invalid" : ""}`}
                  placeholder="e.g. Indie Music Night"
                  value={formValues.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  disabled={submitting}
                  required
                />
                {fieldErrors.title && (
                  <span className="form-error">{fieldErrors.title}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="event-category" className="form-label">
                  Category *
                </label>
                <input
                  id="event-category"
                  type="text"
                  list="event-category-options"
                  className={`form-input ${fieldErrors.category ? "is-invalid" : ""}`}
                  placeholder="e.g. Music, Tech, Workshop"
                  value={formValues.category}
                  onChange={(e) => handleFieldChange("category", e.target.value)}
                  disabled={submitting}
                  required
                />
                <datalist id="event-category-options">
                  {CATEGORY_SUGGESTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                {fieldErrors.category && (
                  <span className="form-error">{fieldErrors.category}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="event-date" className="form-label">
                  Date &amp; Time *
                </label>
                <input
                  id="event-date"
                  type="datetime-local"
                  className={`form-input ${fieldErrors.date ? "is-invalid" : ""}`}
                  value={formValues.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  disabled={submitting}
                  required
                />
                {fieldErrors.date && (
                  <span className="form-error">{fieldErrors.date}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="event-venue" className="form-label">
                  Venue *
                </label>
                <input
                  id="event-venue"
                  type="text"
                  className={`form-input ${fieldErrors.venue ? "is-invalid" : ""}`}
                  placeholder="e.g. Phoenix Arena, Bengaluru"
                  value={formValues.venue}
                  onChange={(e) => handleFieldChange("venue", e.target.value)}
                  disabled={submitting}
                  required
                />
                {fieldErrors.venue && (
                  <span className="form-error">{fieldErrors.venue}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="event-price" className="form-label">
                  Ticket Price (INR) *
                </label>
                <input
                  id="event-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`form-input ${fieldErrors.price ? "is-invalid" : ""}`}
                  placeholder="0 for free"
                  value={formValues.price}
                  onChange={(e) => handleFieldChange("price", e.target.value)}
                  disabled={submitting}
                  required
                />
                {fieldErrors.price && (
                  <span className="form-error">{fieldErrors.price}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="event-total-tickets" className="form-label">
                  Total Tickets *
                </label>
                <input
                  id="event-total-tickets"
                  type="number"
                  min={Math.max(1, soldTicketsForEditing)}
                  step="1"
                  className={`form-input ${
                    fieldErrors.totalTickets ? "is-invalid" : ""
                  }`}
                  placeholder="e.g. 150"
                  value={formValues.totalTickets}
                  onChange={(e) =>
                    handleFieldChange("totalTickets", e.target.value)
                  }
                  disabled={submitting}
                  required
                />
                {editingEvent && (
                  <span className="form-hint">
                    {soldTicketsForEditing} ticket(s) sold &middot;{" "}
                    {editingEvent.availableTickets} currently remaining
                  </span>
                )}
                {fieldErrors.totalTickets && (
                  <span className="form-error">{fieldErrors.totalTickets}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-image-url" className="form-label">
                Banner Image URL <span className="form-optional">(optional)</span>
              </label>
              <input
                id="event-image-url"
                type="url"
                className={`form-input ${fieldErrors.imageUrl ? "is-invalid" : ""}`}
                placeholder="https://example.com/banner.jpg"
                value={formValues.imageUrl}
                onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.imageUrl && (
                <span className="form-error">{fieldErrors.imageUrl}</span>
              )}
              {previewImageUrl && (
                <div className="admin-image-preview">
                  <img src={previewImageUrl} alt="Banner preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="event-description" className="form-label">
                Description *
              </label>
              <textarea
                id="event-description"
                rows={4}
                className={`form-input form-textarea ${
                  fieldErrors.description ? "is-invalid" : ""
                }`}
                placeholder="Describe the event schedule, lineup, and highlights..."
                value={formValues.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                disabled={submitting}
                required
              />
              {fieldErrors.description && (
                <span className="form-error">{fieldErrors.description}</span>
              )}
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? editingEvent
                    ? "Saving Changes..."
                    : "Creating Event..."
                  : editingEvent
                    ? "Save Changes"
                    : "Publish Event"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelForm}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-list-section">
        <div className="admin-list-toolbar">
          <h2>All Events ({filteredEvents.length})</h2>
          <input
            type="search"
            className="form-input admin-search-input"
            placeholder="Filter by title, category, or venue..."
            aria-label="Filter admin events"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="state-box" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p>Loading events...</p>
          </div>
        ) : loadError ? (
          <div className="state-box">
            <div className="alert alert-error">{loadError}</div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadEvents}
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="state-box">
            <h3>
              {searchQuery.trim()
                ? "No matching events"
                : "No events created yet"}
            </h3>
            <p>
              {searchQuery.trim()
                ? "Try clearing your search filter."
                : "Create your first event to start selling tickets."}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchQuery("")}
              >
                Clear Filter
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreate}
              >
                + Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="admin-events-list">
            {filteredEvents.map((event) => {
              const isConfirmingDelete = confirmDeleteId === event._id;
              const isDeleting = deletingId === event._id;
              const isSoldOut = event.availableTickets === 0;

              return (
                <article
                  key={event._id}
                  className={`admin-event-row ${
                    editingEvent?._id === event._id ? "is-editing" : ""
                  }`}
                >
                  <div className="admin-event-main">
                    <div className="admin-event-badges">
                      <span className="badge badge-primary">
                        {event.category}
                      </span>
                      <span
                        className={`badge ${
                          isSoldOut ? "badge-danger" : "badge-success"
                        }`}
                      >
                        {event.availableTickets} / {event.totalTickets} tickets
                        left
                      </span>
                      <span className="badge badge-neutral">
                        {formatPrice(event.price)}
                      </span>
                    </div>

                    <h3 className="admin-event-title">
                      <Link to={`/events/${event._id}`}>{event.title}</Link>
                    </h3>

                    <p className="admin-event-meta">
                      <span>{formatDateTime(event.date)}</span>
                      <span>&bull;</span>
                      <span>{event.venue}</span>
                    </p>
                  </div>

                  <div className="admin-event-actions">
                    {isConfirmingDelete ? (
                      <div className="admin-delete-confirm">
                        <span className="admin-delete-prompt">
                          Delete this event?
                        </span>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleConfirmDelete(event)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStartEdit(event)}
                          disabled={Boolean(deletingId)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => {
                            setActionFeedback(null);
                            setConfirmDeleteId(event._id);
                          }}
                          disabled={Boolean(deletingId)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

