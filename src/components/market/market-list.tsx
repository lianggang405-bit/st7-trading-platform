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
      {symbols.map((item) => (
        <MarketItem
          key={item.symbol}
          symbol={item.symbol}
          price={item.price}
          change={item.change}
          onClick={() => onSymbolClick?.(item.symbol)}
        />
      ))}
    </div>
  );
}
