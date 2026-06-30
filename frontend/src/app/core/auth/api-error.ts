import { HttpErrorResponse } from '@angular/common/http';

export function parseApiError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error. Intentá de nuevo.';
  }

  if (error.status === 0) {
    return 'No pudimos conectar con el servidor';
  }

  const detail = error.error?.detail;
  if (typeof detail === 'string' && detail.length > 0) {
    return detail;
  }

  return 'Ocurrió un error. Intentá de nuevo.';
}
