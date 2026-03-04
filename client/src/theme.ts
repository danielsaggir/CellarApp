export const colors = {
  background: "#1a1a2e",
  surface: "#16213e",
  surfaceLight: "#1f2b47",
  primary: "#c9a84c",
  primaryDark: "#a88a3a",
  accent: "#8b2252",
  text: "#f0e6d3",
  textSecondary: "#a89b8c",
  error: "#cf6679",
  border: "#2a3a5c",
  overlay: "rgba(0,0,0,0.7)",
  white: "#ffffff",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const fontSizes = {
  caption: 10,
  small: 12,
  body: 14,
  subtitle: 16,
  title: 22,
  hero: 28,
};

export function getTypeColor(type: string): string {
  switch (type) {
    case "RED":
      return "#8b2252";
    case "WHITE":
      return "#c9a84c";
    case "SPARKLING":
      return "#4a90a4";
    case "ORANGE":
      return "#bf6a30";
    case "ROSE":
      return "#c46b8a";
    default:
      return "#555";
  }
}
