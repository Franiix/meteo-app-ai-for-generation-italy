const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Sereno",
  1: "Prevalentemente sereno",
  2: "Parzialmente nuvoloso",
  3: "Nuvoloso",
  45: "Nebbia",
  48: "Brina con nebbia",
  51: "Pioviggine leggera",
  53: "Pioviggine moderata",
  55: "Pioviggine intensa",
  56: "Pioviggine gelata leggera",
  57: "Pioviggine gelata intensa",
  61: "Pioggia leggera",
  63: "Pioggia moderata",
  65: "Pioggia intensa",
  66: "Pioggia gelata leggera",
  67: "Pioggia gelata intensa",
  71: "Neve leggera",
  73: "Neve moderata",
  75: "Neve intensa",
  77: "Granuli di neve",
  80: "Rovesci leggeri",
  81: "Rovesci moderati",
  82: "Rovesci violenti",
  85: "Rovesci di neve leggeri",
  86: "Rovesci di neve intensi",
  95: "Temporale",
  96: "Temporale con grandine leggera",
  99: "Temporale con grandine intensa",
};

export function getWeatherDescription(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Condizioni variabili";
}
