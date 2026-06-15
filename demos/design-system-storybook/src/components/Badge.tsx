import React from 'react';
import './Badge.css';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pill?: boolean;
  children: React.ReactNode;
}

export const Badge = ({
  variant = 'secondary',
  pill = false,
  className = '',
  children,
  ...props
}: BadgeProps) => {
  const classNames = [
    'ds-badge',
    `ds-badge-${variant}`,
    pill ? 'ds-badge-pill' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
};

export default Badge;
