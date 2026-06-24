// =============================================================
// SHARED UI: Design System Components
// =============================================================
// All MFEs MUST use these components for consistency
// Loaded as singleton via Module Federation shared config
// =============================================================

import React from "react";

// ---- Design Tokens ----
export const tokens = {
  colors: {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    secondary: "#8b5cf6",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#1e293b",
    textMuted: "#64748b",
    border: "#e2e8f0",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    full: "9999px",
  },
  fontSize: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "24px",
    "2xl": "32px",
  },
};

// ---- Button Component ----
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: tokens.borderRadius.md,
    fontWeight: 600,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 150ms ease",
    border: "none",
    outline: "none",
    fontFamily: "inherit",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: tokens.fontSize.xs },
    md: { padding: "8px 16px", fontSize: tokens.fontSize.sm },
    lg: { padding: "12px 24px", fontSize: tokens.fontSize.md },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: tokens.colors.primary,
      color: "#fff",
    },
    secondary: {
      background: tokens.colors.secondary,
      color: "#fff",
    },
    ghost: {
      background: "transparent",
      color: tokens.colors.text,
      border: `1px solid ${tokens.colors.border}`,
    },
    danger: {
      background: tokens.colors.danger,
      color: "#fff",
    },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {loading && <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>}
      {children}
    </button>
  );
};

// ---- Card Component ----
interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  style,
  onClick,
}) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: tokens.colors.surface,
        border: `1px solid ${hovered ? tokens.colors.primary : tokens.colors.border}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
        transition: "all 200ms ease",
        boxShadow: hovered
          ? "0 4px 12px rgba(0,0,0,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---- Badge Component ----
interface BadgeProps {
  children: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
}

export const Badge: React.FC<BadgeProps> = ({ children, color = "primary" }) => {
  const colorMap = {
    primary: { bg: "#eef2ff", text: "#4f46e5" },
    success: { bg: "#ecfdf5", text: "#059669" },
    warning: { bg: "#fffbeb", text: "#d97706" },
    danger: { bg: "#fef2f2", text: "#dc2626" },
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: tokens.borderRadius.full,
        fontSize: tokens.fontSize.xs,
        fontWeight: 600,
        background: colorMap[color].bg,
        color: colorMap[color].text,
      }}
    >
      {children}
    </span>
  );
};

// ---- MFE Label Component ----
interface MfeLabelProps {
  name: string;
  port: number;
  color: string;
}

export const MfeLabel: React.FC<MfeLabelProps> = ({ name, port, color }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: tokens.borderRadius.full,
      fontSize: "11px",
      fontWeight: 700,
      fontFamily: "monospace",
      background: `${color}15`,
      color: color,
      border: `1px dashed ${color}`,
    }}
  >
    <span
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        display: "inline-block",
      }}
    />
    {name} (:{port})
  </div>
);
