/**
 * FOREX Logo 组件
 * 复制自 forexpl.top 的设计
 * - "FOREX" 文字 - 深蓝色加粗，O 为绿色
 */
export function ForexLogo() {
  return (
    <h1 className="text-2xl tracking-tight leading-none flex items-center">
      <svg viewBox="0 0 120 40" className="h-8 w-auto">
        <defs>
          <filter id="bold" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology operator="dilate" radius="0.3" in="SourceAlpha" result="thick" />
            <feMerge>
              <feMergeNode in="thick" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <style>{`
          .logo-text {
            font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
            font-weight: 900;
            font-size: 28px;
          }
        `}</style>
        <text
          x="5"
          y="32"
          className="logo-text"
          fill="#0c1222"
          filter="url(#bold)"
        >F</text>
        <text
          x="28"
          y="32"
          className="logo-text"
          fill="#16a34a"
          filter="url(#bold)"
        >O</text>
        <text
          x="52"
          y="32"
          className="logo-text"
          fill="#0c1222"
          filter="url(#bold)"
        >R</text>
        <text
          x="76"
          y="32"
          className="logo-text"
          fill="#0c1222"
          filter="url(#bold)"
        >E</text>
        <text
          x="98"
          y="32"
          className="logo-text"
          fill="#0c1222"
          filter="url(#bold)"
        >X</text>
      </svg>
    </h1>
  );
}
