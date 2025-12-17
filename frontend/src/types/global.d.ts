declare global {
  interface Window {
    app?: {
      errorApi?: import('../scripts/api').ErrorApi;
      updateErrorTable?: () => void;
    };
    errorTableInstance?: {
      setMode?: (mode: import('../scripts/api').Mode) => void;
    };
    API_BASE_URL?: string;
    aside?: import('../scripts/aside').Aside;
  }
}

export {};
