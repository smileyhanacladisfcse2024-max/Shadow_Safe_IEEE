import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider } from './context/AuthContext';
import { Skeleton } from './components/common/Skeleton';

// Route-level code splitting with React.lazy
const JourneyPage = lazy(() =>
  import('./pages/JourneyPage').then((m) => ({ default: m.JourneyPage }))
);
const FactorsPage = lazy(() =>
  import('./pages/FactorsPage').then((m) => ({ default: m.FactorsPage }))
);
const ReroutePage = lazy(() =>
  import('./pages/ReroutePage').then((m) => ({ default: m.ReroutePage }))
);
const GuardiansPage = lazy(() =>
  import('./pages/GuardiansPage').then((m) => ({ default: m.GuardiansPage }))
);
const HavensPage = lazy(() =>
  import('./pages/HavensPage').then((m) => ({ default: m.HavensPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const SharePage = lazy(() =>
  import('./pages/SharePage').then((m) => ({ default: m.SharePage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2000,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteSuspenseFallback() {
  return (
    <div className="w-full px-margin pt-space-md flex flex-col gap-space-sm select-none">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteSuspenseFallback />}>
              <Routes>
                <Route path="/" element={<AppShell />}>
                  <Route index element={<Navigate to="/journey" replace />} />
                  <Route path="journey" element={<JourneyPage />} />
                  <Route path="factors" element={<FactorsPage />} />
                  <Route path="reroute" element={<ReroutePage />} />
                  <Route path="guardians" element={<GuardiansPage />} />
                  <Route path="havens" element={<HavensPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="share/:token" element={<SharePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
