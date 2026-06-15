import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import './Select.css';

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedValue: string;
  selectOption: (value: string, label: string) => void;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export const Select = ({
  value,
  onChange,
  placeholder = 'Select an option...',
  children,
  className = '',
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (val: string, label: string) => {
    onChange(val);
    setSelectedLabel(label);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedValue: value,
        selectOption,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div className={`ds-select-container ${className}`} ref={containerRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select.Trigger Subcomponent
export interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
}
const SelectTrigger = ({ className = '', placeholder, ...props }: SelectTriggerProps) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select.Trigger must be used within a Select component');
  }

  const { isOpen, setIsOpen, selectedLabel } = context;

  return (
    <button
      type="button"
      className={`ds-select-trigger ${isOpen ? 'ds-select-trigger-open' : ''} ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      {...props}
    >
      <span className={selectedLabel ? 'ds-select-value' : 'ds-select-placeholder'}>
        {selectedLabel || placeholder || 'Select option...'}
      </span>
      <span className="ds-select-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </button>
  );
};

// Select.List Subcomponent
export interface SelectListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
const SelectList = ({ className = '', children, ...props }: SelectListProps) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select.List must be used within a Select component');
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div
      className={`ds-select-list ${className}`}
      role="listbox"
      {...props}
    >
      {children}
    </div>
  );
};

// Select.Option Subcomponent
export interface SelectOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: string; // Keep string to map as label
}
const SelectOption = ({ value, children, className = '', ...props }: SelectOptionProps) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select.Option must be used within a Select component');
  }

  const { selectedValue, selectOption, setSelectedLabel } = context;
  const isSelected = selectedValue === value;

  // Sync label initially if value matches
  useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  return (
    <div
      className={`ds-select-option ${isSelected ? 'ds-select-option-selected' : ''} ${className}`}
      role="option"
      aria-selected={isSelected}
      onClick={() => selectOption(value, children)}
      {...props}
    >
      <span className="ds-select-option-text">{children}</span>
      {isSelected && (
        <span className="ds-select-option-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </div>
  );
};

// Assign sub-components
Select.Trigger = SelectTrigger;
Select.List = SelectList;
Select.Option = SelectOption;

Select.displayName = 'Select';
export default Select;
