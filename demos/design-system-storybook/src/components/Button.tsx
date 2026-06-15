import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps<T extends React.ElementType = 'button'> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'variant' | 'size' | 'className'>;

export const Button = <T extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps<T>) => {
  const Component = (as || 'button') as any;
  
  const classNames = [
    'ds-btn',
    `ds-btn-${variant}`,
    `ds-btn-${size}`,
    isLoading ? 'ds-btn-loading' : '',
    disabled ? 'ds-btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || isLoading;

  return (
    <Component
      className={classNames}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={isLoading ? 'true' : undefined}
      {...props}
    >
      {isLoading && (
        <span className="ds-btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              className="opacity-75"
            />
          </svg>
        </span>
      )}
      
      {!isLoading && leftIcon && <span className="ds-btn-icon ds-btn-icon-left">{leftIcon}</span>}
      <span className="ds-btn-content">{children}</span>
      {!isLoading && rightIcon && <span className="ds-btn-icon ds-btn-icon-right">{rightIcon}</span>}
    </Component>
  );
};

Button.displayName = 'Button';
export default Button;
