import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { TelemetryProvider } from './telemetry/TelemetryProvider';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  router?: MemoryRouterProps;
  client?: QueryClient;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
}

export function renderWithProviders(ui: ReactElement, options?: RenderWithProvidersOptions) {
  const client = options?.client ?? createTestQueryClient();
  const routerProps = options?.router ?? { initialEntries: ['/'] };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TelemetryProvider>
        <QueryClientProvider client={client}>
          <MemoryRouter {...routerProps}>{children}</MemoryRouter>
        </QueryClientProvider>
      </TelemetryProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
