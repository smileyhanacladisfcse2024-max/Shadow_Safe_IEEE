import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  JourneySnapshot,
  RiskReport,
  RoutesResponse,
  GuardiansResponse,
  SOSStatus,
  SOSArmResponse,
  HavensResponse,
  HavenActionResponse,
  PrivacyResponse,
  PurgeResponse,
  DemoStagesResponse,
  TelemetryMockResponse,
  DemoResetResponse,
  GuardianAddRequest,
  Guardian,
  LiveRouteShareResult,
  SharedRouteResponse,
  UserProfile,
  CalculateRouteRequest,
  CalculateRouteResponse,
} from './types';

// Query Keys
export const queryKeys = {
  journey: ['journey'] as const,
  profile: ['profile'] as const,
  risk: ['risk'] as const,
  demo: ['demo'] as const,
  routes: ['routes'] as const,
  havens: (filter: string = 'all') => ['havens', filter] as const,
  guardians: ['guardians'] as const,
  privacy: ['privacy'] as const,
  sos: ['sos'] as const,
  share: (token: string) => ['share', token] as const,
};

// --- Queries ---

export function useJourneyQuery() {
  return useQuery({
    queryKey: queryKeys.journey,
    queryFn: () => apiClient<JourneySnapshot>('/api/journey'),
    refetchInterval: 5000, // fallback if SSE is disconnected
  });
}

export function useRiskQuery() {
  return useQuery({
    queryKey: queryKeys.risk,
    queryFn: () => apiClient<RiskReport>('/api/risk'),
    refetchInterval: 5000,
  });
}

export function useRoutesQuery() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: () => apiClient<RoutesResponse>('/api/routes'),
    refetchInterval: 5000,
  });
}

export function useGuardiansQuery() {
  return useQuery({
    queryKey: queryKeys.guardians,
    queryFn: () => apiClient<GuardiansResponse>('/api/guardians'),
    refetchInterval: 5000,
  });
}

export function useSosStatusQuery() {
  return useQuery({
    queryKey: queryKeys.sos,
    queryFn: () => apiClient<SOSStatus>('/api/sos/status'),
    refetchInterval: 3000,
  });
}

export function useHavensQuery(filter: string = 'all') {
  return useQuery({
    queryKey: queryKeys.havens(filter),
    queryFn: () => apiClient<HavensResponse>(`/api/havens?filter=${encodeURIComponent(filter)}`),
    refetchInterval: 5000,
  });
}

export function usePrivacyQuery() {
  return useQuery({
    queryKey: queryKeys.privacy,
    queryFn: () => apiClient<PrivacyResponse>('/api/privacy'),
    refetchInterval: 5000,
  });
}

export function useDemoStagesQuery() {
  return useQuery({
    queryKey: queryKeys.demo,
    queryFn: () => apiClient<DemoStagesResponse>('/api/demo/stages'),
    refetchInterval: 5000,
  });
}

export function useSharedRouteQuery(token: string, passcode: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.share(token), passcode],
    queryFn: () =>
      apiClient<SharedRouteResponse>(`/api/share/${encodeURIComponent(token)}`, {
        headers: { 'X-Passcode': passcode },
      }),
    enabled: enabled && Boolean(token) && Boolean(passcode),
    retry: false,
    refetchInterval: 4000,
  });
}

// --- Mutations ---

export function useDismissAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<{ dismissed: boolean }>('/api/alert/dismiss', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useSelectRouteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) =>
      apiClient<{ selected_route_id: string }>('/api/routes/select', {
        method: 'POST',
        body: JSON.stringify({ route_id: routeId }),
      }),
    onMutate: async (newRouteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routes });
      const previousRoutes = queryClient.getQueryData<RoutesResponse>(queryKeys.routes);
      if (previousRoutes) {
        queryClient.setQueryData<RoutesResponse>(queryKeys.routes, {
          ...previousRoutes,
          selected_route_id: newRouteId,
          options: previousRoutes.options.map((opt) => ({
            ...opt,
            selected: opt.id.toLowerCase() === newRouteId.toLowerCase(),
          })),
        });
      }
      return { previousRoutes };
    },
    onError: (_err, _newRouteId, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(queryKeys.routes, context.previousRoutes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes });
    },
  });
}

export function useAutoRerouteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient<{ enabled: boolean }>('/api/routes/auto-reroute', {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routes });
      const previousRoutes = queryClient.getQueryData<RoutesResponse>(queryKeys.routes);
      if (previousRoutes) {
        queryClient.setQueryData<RoutesResponse>(queryKeys.routes, {
          ...previousRoutes,
          auto_reroute: {
            ...previousRoutes.auto_reroute,
            enabled,
          },
        });
      }
      return { previousRoutes };
    },
    onError: (_err, _enabled, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(queryKeys.routes, context.previousRoutes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes });
    },
  });
}

export function useAcceptRouteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) =>
      apiClient<{ message: string; journey: JourneySnapshot }>('/api/routes/accept', {
        method: 'POST',
        body: JSON.stringify({ route_id: routeId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(); // invalidates ALL queries
    },
  });
}

export function useSimulateRerouteMutation() {
  return useMutation({
    mutationFn: () =>
      apiClient<{ message: string; preview_route_id: string; predicted_score: number }>(
        '/api/routes/simulate-reroute',
        { method: 'POST' }
      ),
  });
}

export function useNotifyCircleMutation() {
  return useMutation({
    mutationFn: (params: { kind: string; haven_id?: string }) =>
      apiClient<{ message: string; timestamp: string }>('/api/circle/notify', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}

export function useArmSosMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<SOSArmResponse>('/api/sos/arm', { method: 'POST' }),
    onSuccess: (data: SOSArmResponse) => {
      queryClient.setQueryData<SOSStatus>(queryKeys.sos, {
        state: data.state,
        deadline_at: data.deadline_at,
        server_time: data.server_time,
        grace_s: data.grace_s,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useCancelSosMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<{ state: string; message: string }>('/api/sos/cancel', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData<SOSStatus>(queryKeys.sos, { state: 'idle' });
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useResolveSosMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<{ state: string; message: string }>('/api/sos/resolve', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData<SOSStatus>(queryKeys.sos, { state: 'idle' });
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useSilentEscortMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient<{ enabled: boolean; interval_s: number }>('/api/guardians/silent-escort', {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useAddGuardianMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guardian: GuardianAddRequest) =>
      apiClient<Guardian>('/api/guardians', {
        method: 'POST',
        body: JSON.stringify(guardian),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useDeleteGuardianMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guardianId: string) =>
      apiClient<{ deleted: boolean }>(`/api/guardians/${encodeURIComponent(guardianId)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useConfirmCheckinMutation() {
  return useMutation({
    mutationFn: () => apiClient<{ status: string; message: string }>('/api/checkin/confirm', { method: 'POST' }),
  });
}

export function useShareLiveRouteMutation() {
  return useMutation({
    mutationFn: () => apiClient<LiveRouteShareResult>('/api/share/live-route', { method: 'POST' }),
  });
}

export function useHavenActionMutation() {
  return useMutation({
    mutationFn: ({ havenId, action }: { havenId: string; action: 'beacon' | 'call' | 'navigate' | 'ping' | 'activate-path' }) =>
      apiClient<HavenActionResponse>(`/api/havens/${encodeURIComponent(havenId)}/${action}`, {
        method: 'POST',
      }),
  });
}

export function useUpdatePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, enabled }: { policyId: string; enabled: boolean }) =>
      apiClient<{ id: string; enabled: boolean }>(`/api/privacy/policies/${encodeURIComponent(policyId)}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onMutate: async ({ policyId, enabled }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.privacy });
      const previous = queryClient.getQueryData<PrivacyResponse>(queryKeys.privacy);
      if (previous) {
        queryClient.setQueryData<PrivacyResponse>(queryKeys.privacy, {
          ...previous,
          policies: previous.policies.map((p) => (p.id === policyId ? { ...p, enabled } : p)),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.privacy, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.privacy });
      queryClient.invalidateQueries({ queryKey: queryKeys.risk });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function usePurgePrivacyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<PurgeResponse>('/api/privacy/purge', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.privacy });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useMockTelemetryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stage: number) =>
      apiClient<TelemetryMockResponse>('/api/telemetry/mock', {
        method: 'POST',
        body: JSON.stringify({ stage }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate ALL queries
    },
  });
}

export function useResetDemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<DemoResetResponse>('/api/demo/reset', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate ALL queries
    },
  });
}

export function useUpdateCorridorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (corridorData: Record<string, unknown>) =>
      apiClient<JourneySnapshot>('/api/journey/corridor', {
        method: 'POST',
        body: JSON.stringify(corridorData),
      }),
    onSuccess: (updatedJourney) => {
      queryClient.setQueryData(queryKeys.journey, updatedJourney);
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
      queryClient.invalidateQueries({ queryKey: queryKeys.routes });
      queryClient.invalidateQueries({ queryKey: queryKeys.havens('all') });
    },
  });
}

// --- Women's Safety Profile & Auth Hooks ---

export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiClient<UserProfile>('/api/auth/profile'),
    staleTime: 5000,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: Partial<UserProfile>) =>
      apiClient<{ message: string; profile: UserProfile }>('/api/auth/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data.profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { phone_or_email: string; password?: string; is_guest?: boolean }) =>
      apiClient<{ message: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<{ message: string }>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useCalculateRouteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CalculateRouteRequest) =>
      apiClient<CalculateRouteResponse>('/api/routes/calculate', {
        method: 'POST',
        body: JSON.stringify(req),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.routes, data.routes);
      queryClient.setQueryData(queryKeys.journey, data.journey);
      queryClient.invalidateQueries({ queryKey: queryKeys.routes });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
      queryClient.invalidateQueries({ queryKey: queryKeys.havens('all') });
    },
  });
}

export function useNearbyHavensMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { lat: number; lng: number; radius_m?: number; filter?: string }) =>
      apiClient<HavensResponse>('/api/havens/nearby', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.havens('all'), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.havens('all') });
    },
  });
}


