export const colors = {
  primary: {
    label: 'Primary',
    description: 'Màu sắc thương hiệu chính, sử dụng cho các hành động quan trọng.',
    value: 'var(--color-primary)',
  },
  secondary: {
    label: 'Secondary',
    description: 'Màu phụ, dùng cho các nút phụ, badge hoặc trang trí.',
    value: 'var(--color-secondary)',
  },
  success: {
    label: 'Success',
    description: 'Màu trạng thái thành công, hoàn thành, hợp lệ.',
    value: 'var(--color-success)',
  },
  warning: {
    label: 'Warning',
    description: 'Màu cảnh báo, hành động cần chú ý.',
    value: 'var(--color-warning)',
  },
  danger: {
    label: 'Danger',
    description: 'Màu lỗi, cảnh báo nguy hiểm hoặc xóa dữ liệu.',
    value: 'var(--color-danger)',
  },
  info: {
    label: 'Info',
    description: 'Màu thông tin bổ sung, gợi ý.',
    value: 'var(--color-info)',
  },
};

export const spacing = {
  xs: { label: 'xs (4px)', value: 'var(--spacing-xs)' },
  sm: { label: 'sm (8px)', value: 'var(--spacing-sm)' },
  md: { label: 'md (16px)', value: 'var(--spacing-md)' },
  lg: { label: 'lg (24px)', value: 'var(--spacing-lg)' },
  xl: { label: 'xl (32px)', value: 'var(--spacing-xl)' },
  xxl: { label: '2xl (48px)', value: 'var(--spacing-xxl)' },
};

export const radius = {
  none: { label: 'none (0px)', value: 'var(--radius-none)' },
  sm: { label: 'sm (4px)', value: 'var(--radius-sm)' },
  md: { label: 'md (8px)', value: 'var(--radius-md)' },
  lg: { label: 'lg (16px)', value: 'var(--radius-lg)' },
  full: { label: 'full (9999px)', value: 'var(--radius-full)' },
};

export const typography = {
  fonts: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  sizes: {
    xs: { label: 'xs (12px)', value: 'var(--font-size-xs)' },
    sm: { label: 'sm (14px)', value: 'var(--font-size-sm)' },
    base: { label: 'base (16px)', value: 'var(--font-size-base)' },
    lg: { label: 'lg (18px)', value: 'var(--font-size-lg)' },
    xl: { label: 'xl (20px)', value: 'var(--font-size-xl)' },
    xxl: { label: '2xl (24px)', value: 'var(--font-size-xxl)' },
    xxxl: { label: '3xl (30px)', value: 'var(--font-size-xxxl)' },
  },
};

export const shadows = {
  sm: { label: 'Small shadow', value: 'var(--shadow-sm)' },
  md: { label: 'Medium shadow', value: 'var(--shadow-md)' },
  lg: { label: 'Large shadow', value: 'var(--shadow-lg)' },
};
