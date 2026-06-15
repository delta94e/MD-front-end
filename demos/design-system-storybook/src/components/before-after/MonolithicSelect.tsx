import React, { useState } from 'react';

// BAD PATTERN: Rigid JSON configuration input for options (Không cho phép custom item UI hoặc cấu trúc)
interface SelectOptionItem {
  value: string;
  label: string;
}

interface MonolithicSelectProps {
  options: SelectOptionItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  // Bắt đầu phát sinh các hack-prop khi các dự án con cần custom
  showCheckmarkIcon?: boolean;
  highlightValue?: string; // Tự tô đậm giá trị này
  squadBookingChevron?: boolean; // chevron khác biệt
}

export const MonolithicSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  disabled = false,
  showCheckmarkIcon = true,
  highlightValue,
  squadBookingChevron,
}: MonolithicSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(o => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="mono-select" style={{ position: 'relative', width: '100%', textAlign: 'left' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span>{squadBookingChevron ? '▼' : '🗎'}</span>
      </button>

      {isOpen && (
        <div 
          className="mono-select-list" 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            border: '1px solid #ccc',
            background: '#fff',
            borderRadius: '4px',
            zIndex: 100,
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isHighlighted = opt.value === highlightValue;
            
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                  fontWeight: isHighlighted || isSelected ? 'bold' : 'normal',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && showCheckmarkIcon && <span>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonolithicSelect;
