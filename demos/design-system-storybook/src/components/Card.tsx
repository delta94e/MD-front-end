import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card = ({
  bordered = true,
  shadow = 'md',
  className = '',
  children,
  ...props
}: CardProps) => {
  const classNames = [
    'ds-card',
    bordered ? 'ds-card-bordered' : '',
    `ds-card-shadow-${shadow}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardHeader = ({ className = '', ...props }: CardHeaderProps) => (
  <div className={`ds-card-header ${className}`} {...props} />
);

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
const CardTitle = ({ className = '', ...props }: CardTitleProps) => (
  <h3 className={`ds-card-title ${className}`} {...props} />
);

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
const CardDescription = ({ className = '', ...props }: CardDescriptionProps) => (
  <p className={`ds-card-description ${className}`} {...props} />
);

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardBody = ({ className = '', ...props }: CardBodyProps) => (
  <div className={`ds-card-body ${className}`} {...props} />
);

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardFooter = ({ className = '', ...props }: CardFooterProps) => (
  <div className={`ds-card-footer ${className}`} {...props} />
);

// Assign sub-components to main Card component
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.displayName = 'Card';
export default Card;
