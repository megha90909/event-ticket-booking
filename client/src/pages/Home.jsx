import { useEffect, useRef, useState } from "react";
import { fetchEvents } from "../api/eventsApi";
import EventCard from "../components/EventCard";
import { getErrorMessage } from "../utils/format";
import "./Home.css";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const hasLoadedCategories = useRef(false);

  // Debounce search text so rapid typing does not spam the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;

    const loadEvents = async () => {
      setLoading(true);
      setError("");

      try {
        const fetchedEvents = await fetchEvents({
          search: debouncedSearch,
          category: selectedCategory,
        });

        if (ignore) return;
        setEvents(fetchedEvents);

        // Preserve full category options from the unfiltered initial response
        if (
          !hasLoadedCategories.current &&
          !debouncedSearch.trim() &&
          !selectedCategory
        ) {
          const uniqueCategories = Array.from(
            new Set(
              fetchedEvents
                .map((item) => item.category?.trim())
                .filter(Boolean)
            )
          ).sort((a, b) => a.localeCompare(b));

          setCategories(uniqueCategories);
          hasLoadedCategories.current = true;
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err, "Failed to load events."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, selectedCategory, reloadKey]);

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory("");
  };

  const hasActiveFilters = Boolean(searchInput.trim() || selectedCategory);

  return (
    <section className="home-page">
      <div className="home-hero">
        <h1>Discover Upcoming Events</h1>
        <p>
          Browse concerts, workshops, tech meetups, and live experiences near
          you.
        </p>
      </div>

      <div className="home-controls">
        <div className="search-box">
          <input
            type="search"
            className="form-input search-input"
            placeholder="Search by title, venue, or description..."
            aria-label="Search events"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
              }}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        <div
          className="category-filters"
          role="group"
          aria-label="Filter events by category"
        >
          <button
            type="button"
            className={`category-pill ${selectedCategory === "" ? "is-active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-pill ${
                selectedCategory === category ? "is-active" : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="state-box" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Loading events...</p>
        </div>
      ) : error ? (
        <div className="state-box">
          <div className="alert alert-error">{error}</div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setReloadKey((prev) => prev + 1)}
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="state-box">
          <h3>No events found</h3>
          <p>
            {hasActiveFilters
              ? "No events match your current search or category filter."
              : "There are no upcoming events available right now."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

