import { FormEvent, useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { WeeklyForecastData, WeatherCardData } from "./types";
import { getWeatherForCity, getWeeklyForecastForCity } from "./weatherApi";

const starterCities = ["Roma", "Milano"];

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<WeatherCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCard, setSelectedCard] = useState<WeatherCardData | null>(null);
  const [weeklyForecast, setWeeklyForecast] = useState<WeeklyForecastData | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");

  const sortedCards = useMemo(
    () => [...cards].sort((first, second) => first.cityName.localeCompare(second.cityName, "it")),
    [cards],
  );

  useEffect(() => {
    if (!selectedCard) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard]);

  async function loadCity(cityName: string) {
    const normalized = cityName.trim();

    if (!normalized) {
      setErrorMessage("Inserisci il nome di una citta' prima di cercare.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);
    setActiveCity(normalized);

    try {
      const weatherCard = await getWeatherForCity(normalized);

      setCards((currentCards) => {
        const filtered = currentCards.filter((item) => item.cityKey !== weatherCard.cityKey);
        return [weatherCard, ...filtered];
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore imprevisto nel recupero del meteo.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setActiveCity(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCity(query);
  }

  function handleRemoveCard(cityKey: string) {
    setCards((currentCards) => currentCards.filter((item) => item.cityKey !== cityKey));
  }

  function closeModal() {
    setSelectedCard(null);
    setWeeklyForecast(null);
    setIsWeeklyLoading(false);
    setWeeklyError("");
  }

  async function openForecastModal(card: WeatherCardData) {
    setSelectedCard(card);
    setWeeklyForecast(null);
    setWeeklyError("");
    setIsWeeklyLoading(true);

    try {
      const forecast = await getWeeklyForecastForCity(card.cityName);
      setWeeklyForecast(forecast);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore nel recupero della previsione settimanale.";
      setWeeklyError(message);
    } finally {
      setIsWeeklyLoading(false);
    }
  }

  async function loadStarterCities() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const results = await Promise.allSettled(starterCities.map((city) => getWeatherForCity(city)));
      const nextCards = results
        .filter((result): result is PromiseFulfilledResult<WeatherCardData> => result.status === "fulfilled")
        .map((result) => result.value);

      setCards((currentCards) => {
        const currentByKey = new Map(currentCards.map((item) => [item.cityKey, item]));

        for (const card of nextCards) {
          currentByKey.set(card.cityKey, card);
        }

        return Array.from(currentByKey.values());
      });

      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        setErrorMessage("Alcune citta' iniziali non sono state caricate, ma puoi cercarle manualmente.");
      }
    } finally {
      setIsLoading(false);
      setActiveCity(null);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-background app-background-left" />
      <div className="app-background app-background-right" />

      <main className="app-container">
        <section className="hero">
          <p className="eyebrow">React + Open-Meteo</p>
          <h1>Controlla il meteo di piu&apos; citta&apos; in un&apos;unica dashboard.</h1>
          <p className="hero-copy">
            Cerca qualsiasi citta&apos;, recupera temperatura, vento, umidita&apos; e precipitazioni, e sfrutta la cache
            locale per caricamenti piu&apos; veloci.
          </p>

          <form className="search-panel" onSubmit={handleSubmit}>
            <label className="search-label" htmlFor="city-search">
              Nome citta&apos;
            </label>
            <div className="search-row">
              <input
                id="city-search"
                className="search-input"
                type="text"
                placeholder="Es. Napoli, Torino, Tokyo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="primary-button" type="submit" disabled={isLoading}>
                {isLoading && activeCity ? `Caricamento ${activeCity}...` : "Ottieni meteo"}
              </button>
            </div>
            <div className="quick-actions">
              <button className="secondary-button" type="button" onClick={() => void loadStarterCities()} disabled={isLoading}>
                Carica citta&apos; esempio
              </button>
              <p className="helper-text">La cache locale conserva i dati meteo per 10 minuti e la geocodifica per 24 ore.</p>
            </div>
          </form>

          {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
          {!errorMessage && cards.length === 0 ? (
            <div className="status-banner info">
              Nessuna citta&apos; caricata. Cerca una localita&apos; oppure usa le citta&apos; esempio per iniziare.
            </div>
          ) : null}
        </section>

        <section className="summary-grid" aria-label="Riepilogo funzionalita">
          <article className="summary-card">
            <span className="summary-label">Citta&apos; monitorate</span>
            <strong>{cards.length}</strong>
          </article>
          <article className="summary-card">
            <span className="summary-label">Dettagli mostrati</span>
            <strong>Temperatura, vento, umidita&apos;, precipitazioni</strong>
          </article>
          <article className="summary-card">
            <span className="summary-label">Esperienza</span>
            <strong>Messaggi automatici e caricamento multi-citta&apos;</strong>
          </article>
        </section>

        <section className="weather-grid" aria-live="polite">
          {sortedCards.map((card) => (
            <article
              className="weather-card weather-card-clickable"
              key={card.cityKey}
              onClick={() => void openForecastModal(card)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void openForecastModal(card);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="card-top">
                <div>
                  <p className="city-name">{card.cityName}</p>
                  <p className="region-name">{card.regionLabel || "Posizione disponibile"}</p>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveCard(card.cityKey);
                  }}
                >
                  Rimuovi
                </button>
              </div>

              <div className="temperature-row">
                <div>
                  <p className="temperature-value">{Math.round(card.temperature)}°C</p>
                  <p className="temperature-note">Percepita {Math.round(card.apparentTemperature)}°C</p>
                </div>
                <span className="weather-badge">{card.description}</span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Vento</span>
                  <strong>{Math.round(card.windSpeed)} km/h</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Umidita&apos;</span>
                  <strong>{card.humidity}%</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Precipitazioni</span>
                  <strong>{card.precipitation.toFixed(1)} mm</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Coordinate</span>
                  <strong>{formatCoordinates(card.latitude, card.longitude)}</strong>
                </div>
              </div>

              <div className="card-footer">
                <span>Aggiornato alle {formatUpdatedAt(card.fetchedAt)}</span>
                <span>{card.fromCache ? "Da cache" : "Live"}</span>
              </div>
            </article>
          ))}
        </section>
      </main>

      {selectedCard ? (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <section
            className="forecast-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forecast-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Previsione 7 giorni</p>
                <h2 id="forecast-modal-title">
                  {selectedCard.cityName}
                </h2>
                <p className="region-name">{selectedCard.regionLabel || "Posizione disponibile"}</p>
              </div>
              <button className="icon-button" type="button" onClick={closeModal}>
                Chiudi
              </button>
            </div>

            {isWeeklyLoading ? <div className="status-banner info">Caricamento previsioni da oggi a +6 giorni...</div> : null}
            {weeklyError ? <div className="status-banner error">{weeklyError}</div> : null}

            {weeklyForecast ? (
              <>
                <p className="modal-helper">
                  Aggiornato alle {formatUpdatedAt(weeklyForecast.fetchedAt)} · {weeklyForecast.fromCache ? "Da cache" : "Live"}
                </p>
                <div className="weekly-grid">
                  {weeklyForecast.days.map((day, index) => (
                    <article className="weekly-card" key={day.date}>
                      <p className="weekly-day">{index === 0 ? "Oggi" : new Intl.DateTimeFormat("it-IT", { weekday: "long" }).format(new Date(day.date))}</p>
                      <p className="weekly-date">
                        {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit" }).format(new Date(day.date))}
                      </p>
                      <span className="weather-badge">{day.description}</span>
                      <div className="weekly-temps">
                        <strong>{Math.round(day.maxTemperature)}°C</strong>
                        <span>{Math.round(day.minTemperature)}°C</span>
                      </div>
                      <p className="weekly-rain">Pioggia: {day.precipitationProbability}%</p>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
