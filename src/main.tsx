import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { enableMocking } from './mocks/browser';
import { TelemetryProvider } from './telemetry/TelemetryProvider';
import { socket } from './api/mockSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30
    }
  }
});

async function bootstrap() {
  if (import.meta.env.DEV) {
    await enableMocking();
  }

  if (typeof window !== 'undefined') {
    socket.connect();
  }

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container missing');
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <TelemetryProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </TelemetryProvider>
    </React.StrictMode>
  );
}

bootstrap();
