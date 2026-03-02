import { MarketItem } from './market-item';

export interface MarketSymbol {
  symbol: string;
  price: number;
  change: number;
}

interface MarketListProps {
  symbols: MarketSymbol[];
  onSymbolClick?: (symbol: string) => void;
}

export function MarketList({ symbols, onSymbolClick }: MarketListProps) {
  return (
    <div className="bg-white">
      {symbols.map((symbol) => (
        <MarketItem
          key={symbol.symbol}
          symbol={symbol.symbol}
          price={symbol.price}
          change={symbol.change}
          onClick={() => onSymbolClick?.(symbol.symbol)}
        />
      ))}
    </div>
  );
}
