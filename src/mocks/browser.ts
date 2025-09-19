import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function enableMocking() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'test') return;
  await worker.start({ onUnhandledRequest: 'bypass' });
}
