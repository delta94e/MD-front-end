import React from 'react';

// BAD PATTERN: Configuration over Composition (Cố gắng cấu hình cấu trúc thay vì ghép nối)
interface MonolithicCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  imagePosition?: 'top' | 'bottom';
  buttonText?: string;
  onButtonClick?: () => void;
  badgeText?: string;
  badgeColor?: string;
  showFooterLine?: boolean;
  footerText?: string;
  // Càng ngày càng có nhiều yêu cầu tuỳ chỉnh layout
  titleAlign?: 'left' | 'center' | 'right';
  descriptionColor?: string;
  buttonVariant?: 'primary' | 'secondary';
  extraButtonText?: string;
  onExtraButtonClick?: () => void;
}

export const MonolithicCard = ({
  title,
  description,
  imageUrl,
  imagePosition = 'top',
  buttonText,
  onButtonClick,
  badgeText,
  badgeColor = 'red',
  showFooterLine = false,
  footerText,
  titleAlign = 'left',
  descriptionColor,
  buttonVariant = 'primary',
  extraButtonText,
  onExtraButtonClick,
}: MonolithicCardProps) => {
  const imageElement = imageUrl && (
    <img src={imageUrl} alt={title} className="mono-card-img" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
  );

  return (
    <div className="mono-card" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: titleAlign, background: '#fff' }}>
      {imagePosition === 'top' && imageElement}
      
      <div className="mono-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '18px' }}>{title}</h4>
        {badgeText && (
          <span className="mono-card-badge" style={{ backgroundColor: badgeColor, color: '#fff', padding: '2px 6px', fontSize: '12px', borderRadius: '4px' }}>
            {badgeText}
          </span>
        )}
      </div>

      <p className="mono-card-desc" style={{ margin: 0, fontSize: '14px', color: descriptionColor || '#666' }}>
        {description}
      </p>

      {imagePosition === 'bottom' && imageElement}

      {(buttonText || extraButtonText || footerText) && (
        <div className="mono-card-footer" style={{ borderTop: showFooterLine ? '1px solid #eee' : 'none', paddingTop: showFooterLine ? '12px' : '0', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {footerText && <span style={{ fontSize: '12px', color: '#999' }}>{footerText}</span>}
          <div style={{ display: 'flex', gap: '8px' }}>
            {extraButtonText && (
              <button onClick={onExtraButtonClick} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: '4px' }}>
                {extraButtonText}
              </button>
            )}
            {buttonText && (
              <button 
                onClick={onButtonClick} 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  backgroundColor: buttonVariant === 'primary' ? '#0070f3' : '#666', 
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                {buttonText}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonolithicCard;
