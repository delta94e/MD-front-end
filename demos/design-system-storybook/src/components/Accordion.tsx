import React, { createContext, useContext, useState } from 'react';
import './Accordion.css';

interface AccordionContextType {
  expandedKeys: string[];
  toggleKey: (key: string) => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

export interface AccordionProps {
  allowMultiple?: boolean;
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

export const Accordion = ({
  allowMultiple = false,
  defaultValue = [],
  children,
  className = '',
}: AccordionProps) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => {
    if (Array.isArray(defaultValue)) return defaultValue;
    return defaultValue ? [defaultValue] : [];
  });

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const isExpanded = prev.includes(key);
      if (allowMultiple) {
        return isExpanded ? prev.filter((k) => k !== key) : [...prev, key];
      } else {
        return isExpanded ? [] : [key];
      }
    });
  };

  return (
    <AccordionContext.Provider value={{ expandedKeys, toggleKey }}>
      <div className={`ds-accordion ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// Accordion.Item Context & Component
interface AccordionItemContextType {
  value: string;
  isExpanded: boolean;
}
const AccordionItemContext = createContext<AccordionItemContextType | undefined>(undefined);

export interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
const AccordionItem = ({ value, children, className = '' }: AccordionItemProps) => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion.Item must be used within an Accordion component');
  }

  const { expandedKeys } = context;
  const isExpanded = expandedKeys.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded }}>
      <div className={`ds-accordion-item ${isExpanded ? 'ds-accordion-item-expanded' : ''} ${className}`}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

// Accordion.Header Subcomponent
export interface AccordionHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const AccordionHeader = ({ children, className = '' }: AccordionHeaderProps) => {
  const context = useContext(AccordionContext);
  const itemContext = useContext(AccordionItemContext);
  if (!context || !itemContext) {
    throw new Error('Accordion.Header must be used within an Accordion.Item');
  }

  const { toggleKey } = context;
  const { value, isExpanded } = itemContext;

  return (
    <button
      type="button"
      className={`ds-accordion-header ${className}`}
      onClick={() => toggleKey(value)}
      aria-expanded={isExpanded}
    >
      <span className="ds-accordion-header-content">{children}</span>
      <span className="ds-accordion-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </button>
  );
};

// Accordion.Panel Subcomponent
export interface AccordionPanelProps {
  children: React.ReactNode;
  className?: string;
}
const AccordionPanel = ({ children, className = '' }: AccordionPanelProps) => {
  const itemContext = useContext(AccordionItemContext);
  if (!itemContext) {
    throw new Error('Accordion.Panel must be used within an Accordion.Item');
  }

  const { isExpanded } = itemContext;

  if (!isExpanded) return null;

  return (
    <div className={`ds-accordion-panel ${className}`} role="region">
      <div className="ds-accordion-panel-content">
        {children}
      </div>
    </div>
  );
};

// Assign subcomponents
Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Panel = AccordionPanel;

Accordion.displayName = 'Accordion';
export default Accordion;
