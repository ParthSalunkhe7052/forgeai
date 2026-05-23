// Centralized Recharts style configuration
// Apply these to ALL chart instances across the app for visual consistency

export const CHART_STYLE = {
  background: 'transparent',
  gridColor: 'var(--border)',
  axisColor: 'var(--text-muted)',
  axisSize: 11,
  fontFamily: 'DM Mono, monospace',
  tooltipStyle: {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'DM Mono, monospace',
    color: 'var(--text-primary)',
    boxShadow: 'none',
    padding: '8px 12px',
  } as React.CSSProperties,
  cursorStyle: {
    stroke: 'var(--border-strong)',
    strokeWidth: 1,
  },
};

// Controlled chart color palette — use in this order
export const CHART_COLORS = {
  c1: 'var(--chart-1)', // Amber — primary
  c2: 'var(--chart-2)', // Blue — secondary
  c3: 'var(--chart-3)', // Emerald — third
  c4: 'var(--chart-4)', // Violet — fourth (sparse use)
  c5: 'var(--chart-5)', // Gray — baseline/comparison
};

// Resolved hex values for use in recharts Cell/fill where CSS vars don't work
export const CHART_COLORS_HEX = {
  c1: '#F59E0B',
  c2: '#3B82F6',
  c3: '#10B981',
  c4: '#8B5CF6',
  c5: '#6B7280',
};
