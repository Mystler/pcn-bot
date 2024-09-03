interface EDDNMessage {
  $schemaRef: string;
  header: EDDNMessageHeader;
  message: unknown;
}

interface EDDNMessageHeader {
  uploaderId: string;
  softwareName: string;
  softwareVersion: string;
  gameversion?: string;
}

interface EDDNJournalMessage {
  StarSystem: string;
  StationName?: string;
  MarketID?: number;
}
