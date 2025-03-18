import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  :root {
    /* Cores principais - Tema escuro */
    --text-color-primary: #f2f2f2;
    --text-color-secondary: #b8b8b8;
    --text-color-tertiary: #7d7d7d;
    
    --background-color-primary: #121212;
    --background-color-secondary: #1e1e1e;
    --background-color-tertiary: #2d2d2d;
    
    --border-color-primary: #333333;
    --border-color-secondary: #444444;
    
    --color-primary: #4285f4;
    --color-primary-hover: #5294ff;
    --color-secondary: #626262;
    --color-secondary-hover: #6e6e6e;
    
    --color-success: #34a853;
    --color-success-hover: #3ebe5f;
    --color-success-bg: rgba(52, 168, 83, 0.2);
    
    --color-warning: #fbbc05;
    --color-warning-hover: #ffc826;
    --color-warning-bg: rgba(251, 188, 5, 0.2);
    
    --color-error: #ea4335;
    --color-error-hover: #ff4f41;
    --color-error-bg: rgba(234, 67, 53, 0.2);
    
    /* Espaçamentos */
    --spacing-1: 4px;
    --spacing-2: 8px;
    --spacing-3: 12px;
    --spacing-4: 16px;
    --spacing-5: 24px;
    --spacing-6: 32px;
    --spacing-7: 48px;
    --spacing-8: 64px;
    
    /* Tipografia */
    --font-size-xs: 0.75rem;  /* 12px */
    --font-size-sm: 0.875rem; /* 14px */
    --font-size-md: 1rem;     /* 16px */
    --font-size-lg: 1.25rem;  /* 20px */
    --font-size-xl: 1.5rem;   /* 24px */
    --font-size-2xl: 2rem;    /* 32px */
    
    --font-mono: 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
    
    /* Border Radius */
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background-color-primary);
    color: var(--text-color-primary);
    font-size: 16px;
    line-height: 1.5;
  }

  #root {
    height: 100%;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  /* Customização da scrollbar para o tema escuro */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: var(--background-color-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color-secondary);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-color-primary);
  }
`;

export default GlobalStyles;
