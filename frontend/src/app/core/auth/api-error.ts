import { HttpErrorResponse } from '@angular/common/http';

export function parseApiError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error. Intentá de nuevo.';
  }

  if (error.status === 0) {
    return 'No pudimos conectar con el servidor';
  }

  if (error.status === 401 || error.status === 403) {
    return 'Tu sesión expiró. Volvé a iniciar sesión.';
  }

  const detail = error.error?.detail;
  if (typeof detail === 'string' && detail.length > 0) {
    return detail;
  }

  return 'Ocurrió un error. Intentá de nuevo.';
}
