/**
 * 加密货币彩色图标组件
 * 使用 SVG 提供彩色的、明显的品牌图标
 */

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ symbol, size = 24, className = '' }: CryptoIconProps) {
  const iconSize = `${size}px`;

  // 根据交易对返回对应的彩色 SVG 图标
  const getIcon = (symbol: string) => {
    // 比特币 BTC
    if (symbol.includes('BTC') || symbol.includes('bitcoin')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#F7931A"/>
          <path d="M23.189 14.02C23.352 11.436 21.378 10.536 18.835 10.09L18.835 6.656L16.845 6.656L16.845 10.023C16.318 10.023 15.778 10.037 15.244 10.05L15.244 6.656L13.255 6.656L13.255 10.09C12.815 10.1 12.385 10.109 11.965 10.109L11.965 10.099L9.031 10.099L9.031 12.224C9.031 12.224 10.466 12.194 10.438 12.224C11.232 12.224 11.485 12.71 11.543 13.129L11.543 17.089C11.585 17.089 11.615 17.089 11.643 17.099L11.543 17.099L11.543 22.665C11.519 22.956 11.362 23.401 10.778 23.412C10.808 23.437 9.032 23.412 9.032 23.412L8.712 25.824L11.475 25.824C11.976 25.824 12.469 25.834 12.952 25.834L12.952 29.344L14.941 29.344L14.941 25.876C15.492 25.887 16.025 25.891 16.543 25.891L16.543 29.344L18.533 29.344L18.533 25.835C21.093 25.688 22.955 25.021 23.21 22.582C23.418 20.622 22.487 19.711 21.036 19.069C22.064 18.685 22.812 17.931 23.036 16.489C23.334 14.558 22.239 13.795 23.189 14.02ZM20.088 22.293C20.088 23.635 18.044 23.57 17.29 23.57L14.409 23.57L14.409 20.679C15.07 20.679 20.088 20.662 20.088 22.293ZM19.602 17.044C19.602 18.299 17.974 18.229 17.33 18.229L14.409 18.229L14.409 15.507C15.049 15.507 19.602 15.475 19.602 17.044Z" fill="white"/>
        </svg>
      );
    }

    // 以太坊 ETH
    if (symbol.includes('ETH') || symbol.includes('Ethereum')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#627EEA"/>
          <path d="M16.498 4L8 17.678L16.498 13.354L16.498 4Z" fill="#C8CBFA"/>
          <path d="M16.498 4L24.996 17.678L16.498 13.354L16.498 4Z" fill="#8A92B2"/>
          <path d="M16.498 21.968L16.498 28L24.999 19.416L16.498 21.968Z" fill="#C8CBFA"/>
          <path d="M16.498 21.968L8 19.416L16.498 28L16.498 21.968Z" fill="#8A92B2"/>
          <path d="M16.498 20.573L24.996 17.678L16.498 13.356L16.498 20.573Z" fill="#141414"/>
          <path d="M8 17.678L16.498 20.573L16.498 13.356L8 17.678Z" fill="#393939"/>
        </svg>
      );
    }

    // 莱特币 LTC
    if (symbol.includes('LTC') || symbol.includes('Litecoin')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#345D9D"/>
          <path d="M22.667 20.933C22.667 24.067 19.733 26.667 16.267 26.667C12.8 26.667 10 23.933 10 20.933C10 17.8 12.8 15.2 16.267 15.2C19.733 15.2 22.667 17.8 22.667 20.933Z" fill="white"/>
          <path d="M17.333 18.4L17.733 19.6L15.733 20.4L16.133 21.6L14.667 22.133L14.267 20.933L13.333 21.333L13.733 22.667L14.667 22.267L14.267 21.067L16.267 20.267L15.867 19.067L16.8 18.667L16.4 17.467L17.333 17.067L17.733 18.267L18.667 17.867L18.267 16.667L19.2 16.267L19.6 17.467L18.667 17.867L19.067 19.067L18.133 19.467L17.733 18.267L16.8 18.667L17.2 19.867L16.267 20.267L15.867 19.067L16.8 18.667L16.4 17.467L17.333 17.867L17.733 19.067L18.667 18.667L18.267 17.467L19.2 17.067L19.6 18.267L18.667 18.667L19.067 19.867L18.133 20.267L17.733 19.067L16.8 19.467L17.2 20.667L16.267 21.067L15.867 19.867L14.933 20.267L15.333 21.467L14.4 21.867L14 20.667L12.533 21.2L12.133 20L13.6 19.467L13.2 18.267L14.667 17.733L15.067 18.933L16 18.533L15.6 17.333L16.533 16.933L16.933 18.133L18 17.733L17.6 16.533L18.533 16.133L18.933 17.333L17.867 17.733L18.267 18.933L17.333 19.333L16.933 18.133L16 18.533L16.4 19.733L15.467 20.133L15.067 18.933L16 18.533L16.4 17.333L15.467 17.733L15.067 16.533L14.133 16.933L13.733 15.733L12.267 16.267L12.667 17.467L14.133 16.933L14.533 18.133L13.6 18.533L14 19.733L12.533 20.267L12.133 19.067L10.667 19.6L11.067 20.8L12.533 20.267L12.933 21.467L11.467 22L11.867 23.2L13.333 22.667L13.733 23.867L15.2 23.333L14.8 22.133L13.333 22.667L12.933 21.467L14.4 20.933L14.8 22.133L15.733 21.733L15.333 20.533L14.4 20.933L14 19.733L12.533 20.267L12.133 19.067L10.667 19.6L11.067 18.4L12.533 17.867L12.133 16.667L13.6 16.133L14 17.333L15.467 16.8L15.067 15.6L16.533 15.067L16.933 16.267L15.467 16.8L15.867 18L14.4 18.533L14 17.333L15.467 16.8L15.067 15.6L13.6 16.133L13.2 14.933L11.733 15.467L12.133 16.667L13.6 16.133L14 17.333L12.533 17.867L12.133 16.667L10.667 17.2L11.067 18.4L12.533 17.867L12.933 19.067L11.467 19.6L11.067 18.4L12.533 17.867L12.133 16.667L10.667 17.2L11.067 18.4L12.533 17.867L12.933 19.067L11.467 19.6L11.067 18.4L12.533 17.867L12.133 16.667L10.667 17.2L11.067 18.4L12.533 17.867L12.933 19.067L11.467 19.6L11.067 18.4L12.533 17.867Z" fill="#345D9D"/>
        </svg>
      );
    }

    // Solana SOL
    if (symbol.includes('SOL') || symbol.includes('Solana')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="url(#solana-gradient)"/>
          <defs>
            <linearGradient id="solana-gradient" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#9945FF"/>
              <stop offset="100%" stopColor="#14F195"/>
            </linearGradient>
          </defs>
          <path d="M20.667 10.667H24.667C25.2 10.667 25.333 10.933 25.067 11.2L19.733 16.533C19.467 16.8 19.067 16.933 18.667 16.933H14.667C14.133 16.933 14 16.667 14.267 16.4L19.6 11.067C19.867 10.8 20.267 10.667 20.667 10.667Z" fill="white"/>
          <path d="M11.333 21.333H7.333C6.8 21.333 6.667 21.067 6.933 20.8L12.267 15.467C12.533 15.2 12.933 15.067 13.333 15.067H17.333C17.867 15.067 18 15.333 17.733 15.6L12.4 20.933C12.133 21.2 11.733 21.333 11.333 21.333Z" fill="white"/>
          <path d="M20.667 10.667H24.667C25.2 10.667 25.333 10.933 25.067 11.2L19.733 16.533C19.467 16.8 19.067 16.933 18.667 16.933H14.667C14.133 16.933 14 16.667 14.267 16.4L19.6 11.067C19.867 10.8 20.267 10.667 20.667 10.667Z" fill="white"/>
        </svg>
      );
    }

    // Ripple XRP
    if (symbol.includes('XRP') || symbol.includes('Ripple')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#23292F"/>
          <path d="M13.333 10.667H17.333V12H15.333V14H17.333V15.333H15.333V18C15.333 18.8 15.733 19.333 16.4 19.333H17.333V20.667H16.4C15.067 20.667 14.133 19.733 14.133 18.4V15.333H12.4V14H14.133V12H12.4V10.667H13.333ZM20 12V10.667H18.667V12H20ZM20 15.333V14H18.667V15.333H20ZM20 18V16.667H18.667V18H20ZM20 20.667V19.333H18.667V20.667H20ZM12 12V10.667H10.667V12H12ZM12 15.333V14H10.667V15.333H12ZM12 18V16.667H10.667V18H12ZM12 20.667V19.333H10.667V20.667H12Z" fill="white"/>
        </svg>
      );
    }

    // Dogecoin DOGE
    if (symbol.includes('DOGE') || symbol.includes('Dogecoin')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#C2A633"/>
          <path d="M16.4 7.2L24 8.8L23.2 13.2L22.4 12.8V20.8L24 21.6L23.2 24.8L16.4 23.2L9.6 24.8L8.8 21.6L10.4 20.8V12.8L9.6 13.2L8.8 8.8L16.4 7.2ZM16.4 9.6L11.2 10.8V18.8L13.6 20V13.6L19.2 12.4V20L21.6 18.8V10.8L16.4 9.6Z" fill="white"/>
        </svg>
      );
    }

    // Cardano ADA
    if (symbol.includes('ADA') || symbol.includes('Cardano')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#0033AD"/>
          <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4ZM23.2 16L16 22.4L8.8 16L16 9.6L23.2 16Z" fill="white"/>
          <circle cx="16" cy="16" r="2.4" fill="#0033AD"/>
        </svg>
      );
    }

    // Polkadot DOT
    if (symbol.includes('DOT') || symbol.includes('Polkadot')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#E6007A"/>
          <circle cx="16" cy="8" r="2" fill="white"/>
          <circle cx="22" cy="12" r="2" fill="white"/>
          <circle cx="22" cy="20" r="2" fill="white"/>
          <circle cx="16" cy="24" r="2" fill="white"/>
          <circle cx="10" cy="20" r="2" fill="white"/>
          <circle cx="10" cy="12" r="2" fill="white"/>
        </svg>
      );
    }

    // BNB
    if (symbol.includes('BNB') || symbol.includes('Binance')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
          <path d="M16 12L10 18L12 20L16 16L20 20L22 18L16 12Z" fill="white"/>
          <path d="M16 20L10 26L12 28L16 24L20 28L22 26L16 20Z" fill="white"/>
        </svg>
      );
    }

    // Chainlink LINK
    if (symbol.includes('LINK') || symbol.includes('Chainlink')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#2A5ADA"/>
          <path d="M16 8L10 14L12 16L16 12L20 16L22 14L16 8Z" fill="white"/>
          <path d="M16 18L10 24L12 26L16 22L20 26L22 24L16 18Z" fill="white"/>
        </svg>
      );
    }

    // Avalanche AVAX
    if (symbol.includes('AVAX') || symbol.includes('Avalanche')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#E84142"/>
          <path d="M16 10L22 22H10L16 10Z" fill="white"/>
        </svg>
      );
    }

    // Polygon MATIC
    if (symbol.includes('MATIC') || symbol.includes('Polygon')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="16" fill="#8247E5"/>
          <path d="M16 8L24 12.667V20L16 24.667L8 20V12.667L16 8Z" fill="white"/>
        </svg>
      );
    }

    // 默认：通用的加密货币图标
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#6B7280"/>
        <path d="M16 8L22.667 12V20L16 24L9.333 20V12L16 8Z" fill="white"/>
        <circle cx="16" cy="16" r="3" fill="#6B7280"/>
      </svg>
    );
  };

  return getIcon(symbol);
}
