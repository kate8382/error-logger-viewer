/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import type { ErrorApi, Mode } from '../api';
import type { Aside } from '../aside';

// Этот файл расширяет глобальные типы `window` для приложения.
// Используем `import type` чтобы не создавать runtime-зависимостей.

declare namespace global {
  interface Window {
    app?: {
      errorApi?: ErrorApi,
      updateErrorTable?: () => void,
      lang?: string,
    };
    errorTableInstance?: {
      setMode?: (mode: Mode) => void,
    };
    API_BASE_URL?: string;
    aside?: Aside;
  }
}

export {};
