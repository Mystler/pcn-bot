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
  timestamp: string;
  StarSystem: string;
  StationName?: string;
  MarketID?: number;
  StationServices?: string[];
}

interface EDDNCommodityMessage {
  timestamp: string;
  stationName: string;
  marketId: number;
  commodities: EDDNCommodity[];
}

interface EDDNCommodity {
  name: string;
  buyPrice: number;
  stock: number;
  sellPrice: number;
  demand: number;
}

interface EDDNFCMaterialsMessage {
  timestamp: string;
  CarrierID: string;
  Items: EDDNFCMaterial[];
}

interface EDDNFCMaterial {
  Name: string;
  Price: number;
  Stock: number;
  Demand: number;
}
