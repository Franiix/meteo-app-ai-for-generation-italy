# Meteo App React

Applicazione meteo costruita con React, TypeScript e Open-Meteo. Permette di cercare una citta', ottenere le condizioni attuali e mantenere piu' localita' visibili contemporaneamente.

## Funzionalita'

- Ricerca di qualsiasi citta' tramite API Geocoding di Open-Meteo
- Recupero del meteo corrente con temperatura, temperatura percepita, vento, umidita' e precipitazioni
- Descrizione testuale delle condizioni meteo come `Sereno`, `Nuvoloso` o `Pioggia moderata`
- Supporto multi-citta' con visualizzazione contemporanea di piu' card
- Messaggi automatici quando una citta' non viene trovata o i dati non sono disponibili
- Cache locale con `localStorage`
  - geocodifica: 24 ore
  - meteo: 10 minuti
- Interfaccia responsive, pensata per desktop e mobile

## Tecnologie

- React
- TypeScript
- Vite
- Open-Meteo Geocoding API
- Open-Meteo Forecast API

## Avvio del progetto

```bash
npm install
npm run dev
```

Apri poi l'indirizzo mostrato da Vite nel browser, di solito `http://localhost:5173`.

## Build di produzione

```bash
npm run build
npm run preview
```

## Struttura principale

```text
src/
  App.tsx
  cache.ts
  main.tsx
  styles.css
  types.ts
  weatherApi.ts
  weatherCodes.ts
```

## Come funziona

1. L'utente inserisce il nome di una citta'.
2. L'app usa l'API di geocoding per ottenere coordinate e localita'.
3. Le coordinate vengono passate all'API meteo di Open-Meteo.
4. I dati ricevuti vengono mostrati nella dashboard.
5. Se la citta' era gia' presente, la card viene aggiornata invece di essere duplicata.
