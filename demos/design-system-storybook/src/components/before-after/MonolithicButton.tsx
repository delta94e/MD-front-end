import React from 'react';

// BAD PATTERN: Prop Explosion (Càng nhiều đội dùng thì số lượng prop càng tăng lên vô hạn)
interface MonolithicButtonProps {
  text: string;
  isSecondary?: boolean;
  isSuccess?: boolean;
  isDanger?: boolean;
  isWarning?: boolean;
  isOutline?: boolean;
  isGhost?: boolean;
  isSmall?: boolean;
  isLarge?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  hasLeftIcon?: boolean;
  leftIconName?: 'search' | 'arrow' | 'check' | 'close';
  hasRightIcon?: boolean;
  rightIconName?: 'search' | 'arrow' | 'check' | 'close';
  onClick?: () => void;
  // Các prop được thêm vào theo thời gian cho các dự án con
  squadBookingStyle?: boolean;   // Thêm cho team Booking
  squadCheckoutBorder?: boolean; // Thêm cho team Checkout
  customPadding?: string;         // Hack khoảng cách
  forceUppercase?: boolean;      // Ép viết hoa
  titleAttr?: string;            // Thuộc tính hover title
}

export const MonolithicButton = ({
  text,
  isSecondary,
  isSuccess,
  isDanger,
  isWarning,
  isOutline,
  isGhost,
  isSmall,
  isLarge,
  isLoading,
  disabled,
  hasLeftIcon,
  leftIconName,
  hasRightIcon,
  rightIconName,
  onClick,
  squadBookingStyle,
  squadCheckoutBorder,
  customPadding,
  forceUppercase,
  titleAttr,
}: MonolithicButtonProps) => {
  // Logic tính toán class phức tạp, dễ xảy ra lỗi xung đột style
  let btnClass = 'mono-btn';
  
  if (isSecondary) btnClass += ' mono-btn-sec';
  else if (isSuccess) btnClass += ' mono-btn-suc';
  else if (isDanger) btnClass += ' mono-btn-dan';
  else if (isWarning) btnClass += ' mono-btn-war';
  else btnClass += ' mono-btn-pri';

  if (isOutline) btnClass += ' mono-btn-out';
  if (isGhost) btnClass += ' mono-btn-gho';
  
  if (isSmall) btnClass += ' mono-btn-sm';
  else if (isLarge) btnClass += ' mono-btn-lg';
  else btnClass += ' mono-btn-md';

  if (squadBookingStyle) btnClass += ' booking-special-hack';
  if (squadCheckoutBorder) btnClass += ' checkout-special-border';

  // Render icon bằng switch case cứng nhắc (không thể truyền icon tuỳ ý)
  const renderIcon = (name?: string) => {
    if (!name) return null;
    switch (name) {
      case 'search': return <span>🔍</span>;
      case 'arrow': return <span>➔</span>;
      case 'check': return <span>✓</span>;
      case 'close': return <span>✕</span>;
      default: return null;
    }
  };

  const style: React.CSSProperties = {};
  if (customPadding) {
    style.padding = customPadding; // Inline style hack
  }

  return (
    <button
      className={btnClass}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={style}
      title={titleAttr}
    >
      {isLoading && <span className="mono-spinner">🌀 </span>}
      {!isLoading && hasLeftIcon && renderIcon(leftIconName)}
      <span style={{ textTransform: forceUppercase ? 'uppercase' : 'none' }}>
        {text}
      </span>
      {!isLoading && hasRightIcon && renderIcon(rightIconName)}
    </button>
  );
};

export default MonolithicButton;
