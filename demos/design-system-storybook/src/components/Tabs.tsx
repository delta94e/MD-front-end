import React, { createContext, useContext, useState } from 'react';
import './Tabs.css';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({
  defaultValue,
  value,
  onChange,
  children,
  className = '',
}: TabsProps) => {
  const [localActiveTab, setLocalActiveTab] = useState(defaultValue || '');
  
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : localActiveTab;

  const setActiveTab = (val: string) => {
    if (!isControlled) {
      setLocalActiveTab(val);
    }
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`ds-tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tabs.List Subcomponent
export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
const TabsList = ({ children, className = '' }: TabsListProps) => {
  return (
    <div className={`ds-tabs-list ${className}`} role="tablist">
      {children}
    </div>
  );
};

// Tabs.Trigger Subcomponent
export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}
const TabsTrigger = ({ value, children, disabled = false, className = '' }: TabsTriggerProps) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs.Trigger must be used within a Tabs component');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={`ds-tabs-trigger ${isActive ? 'ds-tabs-trigger-active' : ''} ${disabled ? 'ds-tabs-trigger-disabled' : ''} ${className}`}
      onClick={() => !disabled && setActiveTab(value)}
    >
      {children}
    </button>
  );
};

// Tabs.Content Subcomponent
export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
const TabsContent = ({ value, children, className = '' }: TabsContentProps) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs.Content must be used within a Tabs component');
  }

  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div className={`ds-tabs-content ${className}`} role="tabpanel">
      {children}
    </div>
  );
};

// Assign subcomponents
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

Tabs.displayName = 'Tabs';
export default Tabs;
