export interface ParsedFlight {
  airline: string;
  airlineName: string;
  pnr: string;
  flightNumber: string | null;
  passengerName: string | null;
  origin: string | null;
  destination: string | null;
  flightDate: string | null; // YYYY-MM-DD
}

export interface ScanResult {
  newFlights: number;
  totalFlights: number;
}
