/**
 * Standalone Offline Fallback Engine for ShadowSafe 2.0.
 *
 * Provides a complete client-side reactive simulation if the FastAPI backend
 * is offline or temporarily unreachable. Guarantees 0 white-screens and 100% feature availability.
 */
import type {
  JourneySnapshot,
  RiskReport,
  RoutesResponse,
  GuardiansResponse,
  SOSStatus,
  HavensResponse,
  PrivacyResponse,
  DemoStagesResponse,
} from './types';

class FallbackStore {
  public stage: number = 2;
  public tripId: string = '482';
  public sessionId: string = 'SS-2026-WIE-489';
  public selectedRouteId: string = 'b';
  public autoRerouteEnabled: boolean = true;
  public alertDismissed: boolean = false;
  public sosState: 'idle' | 'armed' | 'dispatched' = 'idle';
  public deadlineAt: string | null = null;
  public silentEscort: boolean = false;
  public customCorridor: Record<string, unknown> | null = null;
  public userProfile = {
    id: 'usr-8924',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    email: 'priya.sharma@safenet.org',
    blood_group: 'O+',
    home_address: '42 Sunrise Heights, 12th Main Road',
    home_lat: 12.9716,
    home_lng: 77.6412,
    work_address: 'Cyber Tech Park, Building 4',
    work_lat: 12.8452,
    work_lng: 77.6602,
    primary_guardian: {
      name: 'Anita Sharma (Mother)',
      phone: '+91 98765 43211',
      relation: 'Parent',
      notify_on_deviation: true,
    },
    secondary_guardian: {
      name: 'Rohan Sharma (Brother)',
      phone: '+91 98765 43212',
      relation: 'Family',
      notify_on_deviation: true,
    },
    medical_notes: 'Mild asthma (inhaler carried in bag). No known allergies.',
    emergency_code: 'Silver Sparrow',
    is_authenticated: true,
    onboarding_completed: true,
  };

  public guardians = [
    {
      id: 'guardian-alice',
      name: 'Alice M.',
      relation: 'Family',
      kind: 'personal',
      battery_pct: 84,
      status_text: 'Location shared live • Battery 84%',
      location_shared: true,
      priority_link: false,
    },
    {
      id: 'guardian-official',
      name: 'Transit Safety & Campus Patrol',
      relation: 'Official',
      kind: 'official',
      battery_pct: null,
      status_text: 'Priority dispatch link ready',
      location_shared: true,
      priority_link: true,
    },
  ];

  public policies = [
    {
      id: 'ephemeral_location',
      title: 'Ephemeral Location Retention',
      description: 'Wipe coordinate cache automatically on trip arrival',
      enabled: true,
    },
    {
      id: 'anonymized_crowdsourcing',
      title: 'Anonymized Incident Crowdsourcing',
      description: 'Transmit k-anonymous noise-perturbed hazard flags',
      enabled: true,
    },
    {
      id: 'fuzzy_offset',
      title: 'Fuzzy Offset Location Sharing',
      description: 'Obfuscate live guardian feed radius by ±75 meters',
      enabled: true,
    },
  ];

  public stages = [
    { id: 1, name: 'Nominal Baseline', subtitle: 'Standard lit path • Verified corridor', score: 12, active: false },
    { id: 2, name: 'Route Deviation (Active)', subtitle: '220m off path • Amber caution alert', score: 38, active: true },
    { id: 3, name: 'Unscheduled Stop', subtitle: '4m idle interval • Unverified dark sector', score: 67, active: false },
    { id: 4, name: 'Incident Corroboration', subtitle: 'Audio noise surge + Lighting grid outage', score: 89, active: false },
    { id: 5, name: 'Safer Reroute Recommended', subtitle: 'Transit corridor diverted via 4th Ave', score: 14, active: false },
  ];

  public havens = [
    {
      id: 'haven-stjude',
      name: 'St. Jude Health Hub',
      address: '324 Beacon Avenue • Public Community Wing',
      icon: 'health_and_safety',
      tags: ['medical', 'staffed', 'beacon'],
      x_m: -127,
      y_m: 127,
      hours: '24/7',
      closes_at: null,
      cctv_cameras: 9,
      lux: 184,
      capabilities: [
        { icon: 'meeting_room', label: 'Secure Vestibule' },
        { icon: 'support_agent', label: 'Desk Intercom Link' },
        { icon: 'battery_charging_full', label: 'Fast Device Power' },
        { icon: 'local_police', label: 'Transit Link Hotwire' },
      ],
      phone: '5550192',
      direction: 'NW',
      distance_m: 180,
      walk_min: 2,
      note: 'Vetted Municipal Partner with 24/7 on-site medical staff',
    },
    {
      id: 'haven-transit-kiosk',
      name: 'Oakland Transit Kiosk',
      address: 'Concourse Level Guard Booth #3',
      icon: 'directions_subway',
      tags: ['transit', 'staffed', 'beacon'],
      x_m: 330,
      y_m: -80,
      hours: '24/7',
      closes_at: null,
      cctv_cameras: 4,
      lux: 140,
      capabilities: [{ icon: 'local_police', label: 'Direct Transit Police' }],
      phone: '5550199',
      direction: 'E',
      distance_m: 340,
      walk_min: 4,
      note: 'Transit Security checkpoint staffed with CCTV monitoring',
    },
    {
      id: 'haven-cvs',
      name: 'CVS 24h & Well-Lit Plaza',
      address: '502 Harrison St',
      icon: 'local_pharmacy',
      tags: ['medical', 'staffed', 'beacon'],
      x_m: 400,
      y_m: 90,
      hours: '24/7',
      closes_at: null,
      cctv_cameras: 6,
      lux: 210,
      capabilities: [{ icon: 'storefront', label: '24/7 Open Store' }],
      phone: '5550198',
      direction: 'E',
      distance_m: 410,
      walk_min: 5,
      note: 'Well-lit commercial pharmacy on major thoroughfare',
    },
  ];

  public getScore(): number {
    const st = this.stages.find((s) => s.id === this.stage) || this.stages[1];
    let base = st.score;
    const crowdsourcing = this.policies.find((p) => p.id === 'anonymized_crowdsourcing');
    if (this.stage === 2 && crowdsourcing && !crowdsourcing.enabled) {
      base = 35;
    }
    return base;
  }

  public getJourney(): JourneySnapshot {
    const score = this.getScore();
    const band = score > 75 ? 'critical' : score > 50 ? 'elevated' : score > 20 ? 'moderate' : 'safe';
    const badge = score > 75 ? 'CRITICAL RISK' : score > 20 ? 'MODERATE ATTENTION' : 'SAFE NOMINAL';

    const origin = (this.customCorridor?.origin as string) || 'Montgomery St Metro';
    const destination = (this.customCorridor?.destination as string) || 'Oakland Tech District';
    const lineLabel = (this.customCorridor?.line_label as string) || 'Bus 14R · Toward Downtown Central';
    const lineShort = (this.customCorridor?.line_short as string) || '14R';
    const dist = (this.customCorridor?.distance_km as number) || 3.4;
    const eta = (this.customCorridor?.eta_minutes as number) || 14;

    return {
      trip_id: this.tripId,
      session_id: this.sessionId,
      stage: this.stage,
      evaluated_at: new Date().toISOString(),
      trip: {
        line_label: lineLabel,
        line_short: lineShort,
        status_chip: 'Transit Monitored',
        origin,
        destination,
        eta_minutes: eta,
        eta_clock: `${new Date(Date.now() + eta * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        distance_km: dist,
        lighting_lux: score > 50 ? 12 : 65,
        lighting_label: score > 50 ? 'Low (12 lx)' : 'Medium (65 lx)',
        crowd_label: score > 50 ? 'Sparse' : 'Moderate',
      },
      vehicle: {
        x_m: this.stage === 2 ? 0 : 40,
        y_m: this.stage === 2 ? 0 : -20,
        speed_kmh: this.stage === 3 ? 0 : 28,
        heading: 'N-NE',
        idle_s: this.stage === 3 ? 240 : 0,
      },
      corridor: {
        deviation_m: this.stage === 2 ? 220 : this.stage > 2 ? 310 : 15,
        divergence_point: { x_m: 0, y_m: 0 },
        street_label: (this.customCorridor?.street_label as string) || '7th St',
      },
      risk: {
        score,
        band,
        badge,
        headline: score > 20 ? 'Route Deviation Detected' : 'Nominal Safe Corridor',
        explanation: [
          { t: 'Vehicle turned off ' },
          { t: 'Grand Blvd corridor', b: true },
          { t: ' into ' },
          { t: '7th St warehouse precinct', b: true },
          { t: '. Normal transit routes do not navigate this side arterial.' },
        ],
      },
      alert:
        !this.alertDismissed && this.stage >= 2
          ? {
              id: `alert-stage-${this.stage}`,
              severity: score > 75 ? 'critical' : 'moderate',
              message: [
                { t: 'Bus turned onto unlit 7th St', b: true },
                { t: ' (220m from corridor).' },
              ],
              dismissed: false,
            }
          : null,
      guardians: {
        connected: this.guardians.filter((g) => g.kind === 'personal').length,
        names: this.guardians.filter((g) => g.kind === 'personal').map((g) => g.name),
        status: 'Protected',
        sharing_text: 'Sharing live GPS location & bus status',
      },
      havens_nearby: {
        count_within_500m: this.havens.length,
        items: this.havens.map((h) => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          distance_m: h.distance_m,
          note: `${h.hours} • ${h.direction}`,
          x_m: h.x_m,
          y_m: h.y_m,
        })),
      },
      sensors: {
        gps_accuracy_m: 1.2,
        cell_signal: '4G LTE',
        audio_anomaly: this.stage === 4 ? 0.85 : 0.05,
      },
      sos: {
        state: this.sosState,
      },
    };
  }

  public getRisk(): RiskReport {
    const score = this.getScore();
    const isStage2CrowdsourceOff = this.stage === 2 && !this.policies[1].enabled;
    const factorPoints = isStage2CrowdsourceOff ? [18, 9, 4, 4] : [18, 9, 7, 4];

    return {
      engine: {
        label: 'FastAPI Scoring Engine',
        version: 'v2.4.2',
        evaluated_at: new Date().toISOString(),
      },
      score,
      band: score > 75 ? 'critical' : score > 50 ? 'elevated' : score > 20 ? 'moderate' : 'safe',
      label: score > 75 ? 'Critical Emergency Vector' : score > 20 ? 'Elevated Caution Required (Moderate Risk)' : 'Nominal Safe Corridor',
      safe_threshold: 20,
      disclaimer:
        'Algorithmic certainty is transparent. This score reflects an unannounced arterial deviation and atypical stop duration.',
      weights: {
        corridor_deviation: 0.35,
        dwell_time: 0.25,
        civic_advisory: 0.20,
        environmental_trust: 0.20,
      },
      drivers: [
        { id: 'corridor', label: 'Corridor', points: factorPoints[0], share_pct: 47 },
        { id: 'dwell', label: 'Dwell', points: factorPoints[1], share_pct: 24 },
        { id: 'advisory', label: 'Advisory', points: factorPoints[2], share_pct: 18 },
        { id: 'env', label: 'Env', points: factorPoints[3], share_pct: 11 },
      ],
      factors: [
        {
          id: 'corridor',
          title: 'Route Corridor Compliance',
          subtitle: 'Deviation Detected (220m off corridor)',
          icon: 'navigation',
          points: factorPoints[0],
          impact_label: 'Impact',
          narrative: [
            { t: 'Vehicle turned off ' },
            { t: 'Grand Blvd corridor', b: true },
            { t: ' into ' },
            { t: '7th St warehouse precinct', b: true },
            { t: '. Normal transit bus routes do not navigate this side arterial.' },
          ],
          confidence_pct: 94,
          trace: 'GPS Triangulation + OSRM Map-Match',
          corridor: {
            current_label: '7th St Warehouse Ln',
            delta_label: 'Delta: 220m N-NE',
          },
        },
        {
          id: 'dwell',
          title: 'Dwell & Stop Duration Anomaly',
          subtitle: 'Unexpected Stop for 3m 45s',
          icon: 'timer_pause',
          points: factorPoints[1],
          impact_label: 'Impact',
          narrative: [
            {
              t: 'Unscheduled halt outside designated metro transit stops without matching municipal traffic delay or red light telemetry at this junction.',
            },
          ],
          confidence_pct: 88,
          trace: 'Speedometer 0.0 km/h • Acc: ±1.2m',
          dwell: {
            dot_congestion_pct: 0,
            scheduled_stops: 0,
            speed_kmh: 0,
            accuracy_m: 1.2,
          },
        },
        {
          id: 'advisory',
          title: 'Corroborated Incident Reports',
          subtitle: '1 Verified Advisory within 600m',
          icon: 'campaign',
          points: factorPoints[2],
          impact_label: 'Impact',
          narrative: [
            { t: 'Local transit advisory logged 18 mins ago regarding street lighting repair & low footfall zone near ' },
            { t: '7th & Market', b: true },
            { t: '.' },
          ],
          confidence_pct: 91,
          trace: 'Municipal OpenCivic Feed #4092-B',
          advisory: {
            source: 'Municipal OpenCivic Feed #4092-B',
            age_min: 18,
            corroboration_label: '1 Civic feed • 3 Commuter pings',
          },
        },
        {
          id: 'environment',
          title: 'Environmental Trust Index',
          subtitle: 'Composite Ambient Surroundings',
          icon: 'nature_people',
          points: factorPoints[3],
          impact_label: 'Impact',
          narrative: [
            { t: 'Sparse pedestrian activity and degraded street lighting detected on secondary arterial.' },
          ],
          confidence_pct: 86,
          trace: 'Lux & Cellular Telemetry Array',
          environment: {
            quadrants: [
              { id: 'lighting', label: 'Lighting', value: '34%', sublabel: 'Low Luminance' },
              { id: 'cell', label: 'Cell Signal', value: '4G LTE', sublabel: 'Reliable Uplink' },
              { id: 'crowd', label: 'Crowd Density', value: 'Sparse', sublabel: '< 3 pedestrians/100m' },
              { id: 'havens', label: 'Safe Havens', value: '2 Open', sublabel: 'Within 400m radius' },
            ],
          },
        },
      ],
      nearest_haven: {
        id: 'haven-cvs',
        name: 'CVS 24-hr Pharmacy',
        distance_m: 310,
        direction: 'East',
        note: 'Well-lit path',
      },
    };
  }

  public getRoutes(): RoutesResponse {
    return {
      headline: 'Dynamic Corridor Reroute',
      subtitle: 'FastAPI Recommendation Engine found 2 verified safer alternatives',
      selected_route_id: this.selectedRouteId,
      auto_reroute: {
        enabled: this.autoRerouteEnabled,
        threshold: 50,
        standing_by: this.autoRerouteEnabled && this.getScore() > 50,
      },
      options: [
        {
          id: 'b',
          name: 'Route B: Safe Haven',
          tag: 'Recommended',
          description: 'Well-lit commercial avenue, 4 open 24/7 stores',
          time_min: 15,
          time_delta: '+3 min',
          concern: 8,
          chips: [
            { icon: 'shield', label: 'Concern: 8/100' },
            { icon: 'videocam', label: 'CCTV Monitored' },
          ],
          metrics: [
            { label: '92% Illumination', detail: 'Sensor verified' },
            { label: 'Continuous 5G', detail: 'Zero dead-zones' },
            { label: 'Safe Haven @ 350m', detail: '24/7 Pharmacy' },
            { label: 'Police Substation', detail: 'Active patrol area' },
          ],
          selected: this.selectedRouteId === 'b',
        },
        {
          id: 'a',
          name: 'Route A: Current Diverted',
          tag: '',
          description: 'Dark alleyways, low visibility zone',
          time_min: 12,
          time_delta: 'Fastest',
          concern: 38,
          chips: [
            { icon: 'crisis_alert', label: 'Concern: 38/100' },
            { icon: 'power_off', label: 'Dimly Lit' },
          ],
          metrics: [
            { label: '28% Illumination', detail: 'Sensor verified' },
            { label: 'Degraded 3G', detail: '2 dead-zones detected' },
            { label: 'No Safe Haven', detail: 'Nearest 520m away' },
            { label: 'No Patrol', detail: 'Unstaffed sector' },
          ],
          selected: this.selectedRouteId === 'a',
        },
        {
          id: 'c',
          name: 'Route C: Transit Hub',
          tag: '',
          description: 'Oakland Central Station concourse link',
          time_min: 18,
          time_delta: '+6 min',
          concern: 11,
          chips: [
            { icon: 'verified', label: 'Concern: 11/100' },
            { icon: 'train', label: 'Staffed Hub' },
          ],
          metrics: [
            { label: '98% Illumination', detail: 'Transit concourse' },
            { label: 'Full 5G Ultra', detail: 'Dedicated microcells' },
            { label: 'Police Kiosk @ 100m', detail: 'Transit Officers' },
            { label: 'Restrooms & Warmth', detail: 'Indoor sanctuary' },
          ],
          selected: this.selectedRouteId === 'c',
        },
      ],
    };
  }

  public getGuardians(): GuardiansResponse {
    const personal = this.guardians.filter((g) => g.kind === 'personal');
    return {
      trip_id: this.tripId,
      protection: {
        state: 'active',
        title: 'Active Trip Protection',
        subtitle: 'Live GPS & Guardian Sharing Active',
      },
      grace_s: 5,
      silent_escort: {
        enabled: this.silentEscort,
        interval_s: 120,
      },
      guardians: this.guardians,
      active_count: personal.length,
      immediate_haven: {
        id: 'haven-stjude',
        name: 'St. Jude 24/7 Health Hub',
        distance_m: 180,
        walk_min: 2,
        direction: 'NW',
        phone: '5550192',
      },
      emergency_lines: [
        { name: '911 Emergency Dispatch', tel: '911', tag: 'DIRECT' },
        { name: 'Campus & Transit Safety Patrol', tel: '5550199', tag: 'SECURITY' },
      ],
    };
  }

  public getHavens(filter: string = 'all'): HavensResponse {
    let filtered = [...this.havens];
    if (filter === 'staffed') filtered = filtered.filter((h) => h.tags.includes('staffed'));
    if (filter === 'transit') filtered = filtered.filter((h) => h.tags.includes('transit'));
    if (filter === 'medical') filtered = filtered.filter((h) => h.tags.includes('medical'));
    if (filter === 'beacon') filtered = filtered.filter((h) => h.tags.includes('beacon'));

    return {
      mesh: {
        label: 'Sanctuary Mesh v2.4 Active',
        nodes_in_range: this.havens.length,
      },
      counts: {
        all: 5,
        staffed: 3,
        transit: 1,
        medical: 2,
        beacon: 4,
      },
      filter,
      spotlight: {
        id: 'haven-stjude',
        name: 'St. Jude Health Hub',
        address: '324 Beacon Avenue • Public Community Wing',
        distance_m: 180,
        walk_min: 2,
        direction: 'NW',
        tags: ['medical', 'staffed', 'beacon'],
        cctv_cameras: 9,
        lux: 184,
        capabilities: [
          { icon: 'meeting_room', label: 'Secure Vestibule' },
          { icon: 'support_agent', label: 'Desk Intercom Link' },
          { icon: 'battery_charging_full', label: 'Fast Device Power' },
          { icon: 'local_police', label: 'Transit Link Hotwire' },
        ],
        phone: '5550192',
        note: 'Vetted Municipal Partner with 24/7 on-site medical staff',
      },
      items: filtered,
    };
  }

  public getPrivacy(): PrivacyResponse {
    return {
      session_id: this.sessionId,
      storage: 'RAM ONLY',
      cipher: 'AES-GCM-256',
      bytes_held: 0,
      policies: this.policies,
      compliance_badges: [
        { icon: 'face', label: 'No Biometrics Stored' },
        { icon: 'videocam_off', label: 'Zero Raw Media' },
        { icon: 'timer_off', label: 'Ephemeral Sessions' },
      ],
    };
  }

  public getDemoStages(): DemoStagesResponse {
    return {
      active_stage: this.stage,
      stages: this.stages.map((s) => ({
        ...s,
        active: s.id === this.stage,
      })),
    };
  }

  public getSosStatus(): SOSStatus {
    return {
      state: this.sosState,
      deadline_at: this.deadlineAt,
      server_time: new Date().toISOString(),
      grace_s: 5,
    };
  }
}

export const fallbackStore = new FallbackStore();

/**
 * Handle API requests through offline fallback simulation
 */
export async function handleOfflineRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const path = url.replace(/^\/api/, '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Artificial short realistic delay
  await new Promise((resolve) => setTimeout(resolve, 35));

  // Route matches
  if (path === '/journey' && method === 'GET') {
    return fallbackStore.getJourney() as T;
  }
  if (path === '/journey/corridor' && method === 'POST') {
    fallbackStore.customCorridor = body;
    return fallbackStore.getJourney() as T;
  }
  if (path === '/alert/dismiss' && method === 'POST') {
    fallbackStore.alertDismissed = true;
    return { dismissed: true } as T;
  }
  if (path === '/risk' && method === 'GET') {
    return fallbackStore.getRisk() as T;
  }
  if (path === '/routes' && method === 'GET') {
    return fallbackStore.getRoutes() as T;
  }
  if (path === '/routes/select' && method === 'POST') {
    fallbackStore.selectedRouteId = body.route_id || 'b';
    return { selected_route_id: fallbackStore.selectedRouteId } as T;
  }
  if (path === '/routes/auto-reroute' && method === 'PUT') {
    fallbackStore.autoRerouteEnabled = Boolean(body.enabled);
    return { enabled: fallbackStore.autoRerouteEnabled } as T;
  }
  if (path === '/routes/accept' && method === 'POST') {
    fallbackStore.stage = 5;
    return {
      message: 'Accepted safe corridor via Broadway. Turn-by-turn navigation active.',
      journey: fallbackStore.getJourney(),
    } as T;
  }
  if (path === '/routes/simulate-reroute' && method === 'POST') {
    return {
      message: 'Calculating optimal safe vector via Grand Boulevard...',
      preview_route_id: 'b',
      predicted_score: 8,
    } as T;
  }
  if (path.startsWith('/havens') && method === 'GET') {
    const urlObj = new URL(`http://localhost${url}`);
    const filter = urlObj.searchParams.get('filter') || 'all';
    return fallbackStore.getHavens(filter) as T;
  }
  if (path.includes('/beacon') || path.includes('/navigate') || path.includes('/call') || path.includes('/ping') || path.includes('/activate-path')) {
    const parts = path.split('/');
    const action = parts[parts.length - 1];
    return {
      message: `${action.toUpperCase()} activated for sanctuary node`,
      haven_id: parts[2] || 'haven-stjude',
    } as T;
  }
  if (path === '/guardians' && method === 'GET') {
    return fallbackStore.getGuardians() as T;
  }
  if (path === '/guardians' && method === 'POST') {
    const newG = {
      id: `guardian-${Date.now()}`,
      name: body.name,
      relation: body.relation || 'Friend',
      kind: 'personal',
      battery_pct: 95,
      status_text: `Phone: ${body.phone}`,
      location_shared: true,
      priority_link: false,
    };
    fallbackStore.guardians.push(newG);
    return newG as T;
  }
  if (path.startsWith('/guardians/') && method === 'DELETE') {
    const id = path.replace('/guardians/', '');
    fallbackStore.guardians = fallbackStore.guardians.filter((g) => g.id !== id);
    return { deleted: true } as T;
  }
  if (path === '/guardians/silent-escort' && method === 'PUT') {
    fallbackStore.silentEscort = Boolean(body.enabled);
    return { enabled: fallbackStore.silentEscort, interval_s: 120 } as T;
  }
  if (path === '/sos/status' && method === 'GET') {
    return fallbackStore.getSosStatus() as T;
  }
  if (path === '/sos/arm' && method === 'POST') {
    fallbackStore.sosState = 'armed';
    fallbackStore.deadlineAt = new Date(Date.now() + 5000).toISOString();
    return {
      state: 'armed',
      deadline_at: fallbackStore.deadlineAt,
      server_time: new Date().toISOString(),
      grace_s: 5,
    } as T;
  }
  if (path === '/sos/cancel' && method === 'POST') {
    fallbackStore.sosState = 'idle';
    fallbackStore.deadlineAt = null;
    return { state: 'idle', message: 'SOS cancelled' } as T;
  }
  if (path === '/sos/resolve' && method === 'POST') {
    fallbackStore.sosState = 'idle';
    fallbackStore.deadlineAt = null;
    return { state: 'idle', message: 'SOS resolved' } as T;
  }
  if (path === '/checkin/confirm' && method === 'POST') {
    return { status: 'confirmed', message: 'Check-in confirmed' } as T;
  }
  if (path === '/privacy' && method === 'GET') {
    return fallbackStore.getPrivacy() as T;
  }
  if (path.startsWith('/privacy/policies/') && method === 'PUT') {
    const polId = path.replace('/privacy/policies/', '');
    const p = fallbackStore.policies.find((pol) => pol.id === polId);
    if (p) p.enabled = Boolean(body.enabled);
    return { id: polId, enabled: Boolean(body.enabled) } as T;
  }
  if (path === '/privacy/purge' && method === 'POST') {
    return {
      purged: true,
      bytes_held: 0,
      cleared: { session_id: fallbackStore.sessionId },
    } as T;
  }
  if (path === '/demo/stages' && method === 'GET') {
    return fallbackStore.getDemoStages() as T;
  }
  if (path === '/telemetry/mock' && method === 'POST') {
    fallbackStore.stage = Number(body.stage) || 2;
    fallbackStore.alertDismissed = false;
    return {
      journey: fallbackStore.getJourney(),
      risk_score: fallbackStore.getScore(),
      band: fallbackStore.getScore() > 20 ? 'moderate' : 'safe',
      latency_ms: 32,
    } as T;
  }
  if (path === '/demo/reset' && method === 'POST') {
    fallbackStore.stage = 2;
    fallbackStore.alertDismissed = false;
    fallbackStore.selectedRouteId = 'b';
    fallbackStore.policies.forEach((p) => {
      p.enabled = true;
    });
    return {
      message: 'Demo state reset to Stage 2 (Nominal Deviation)',
      active_stage: 2,
    } as T;
  }
  if (path === '/circle/notify' && method === 'POST') {
    return {
      message: 'Audit log link encrypted & dispatched to Circle: Alice & Maya',
      timestamp: new Date().toISOString(),
    } as T;
  }
  if (path === '/share/live-route' && method === 'POST') {
    const token = 'live-' + Math.random().toString(36).substring(2, 8);
    const passcode = String(Math.floor(1000 + Math.random() * 9000));
    return {
      url: `${window.location.origin}/share/${token}`,
      token,
      passcode,
      expires_at: new Date(Date.now() + 1800000).toISOString(),
    } as T;
  }
  if (path.startsWith('/share/') && method === 'GET') {
    return {
      trip_id: fallbackStore.tripId,
      position: { x_m: 0, y_m: 0 },
      risk_score: fallbackStore.getScore(),
      band: 'MODERATE',
      heading: 'N-NE',
      timestamp: new Date().toISOString(),
    } as T;
  }
  if (path === '/auth/profile' && method === 'GET') {
    return fallbackStore.userProfile as T;
  }
  if (path === '/auth/profile' && (method === 'POST' || method === 'PUT')) {
    Object.assign(fallbackStore.userProfile, body);
    fallbackStore.userProfile.is_authenticated = true;
    fallbackStore.userProfile.onboarding_completed = true;
    return { message: 'Profile updated', profile: fallbackStore.userProfile } as T;
  }
  if (path === '/auth/login' && method === 'POST') {
    fallbackStore.userProfile.is_authenticated = true;
    return { message: 'Logged in', user: fallbackStore.userProfile } as T;
  }
  if (path === '/auth/logout' && method === 'POST') {
    fallbackStore.userProfile.is_authenticated = false;
    return { message: 'Logged out' } as T;
  }
  if (path === '/routes/calculate' && method === 'POST') {
    const origin = (body as any)?.origin || { name: 'Indiranagar 100ft Rd', lat: 12.9716, lng: 77.6412 };
    const destination = (body as any)?.destination || { name: 'Electronic City Campus', lat: 12.8452, lng: 77.6602 };
    fallbackStore.customCorridor = {
      origin: origin.name,
      destination: destination.name,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_lat: destination.lat,
      dest_lng: destination.lng,
      distance_km: 8.4,
      eta_minutes: 24,
      is_real_route: true,
      line_label: 'Route B: Safe Sanctuary Corridor',
    };
    return {
      message: 'Routes calculated',
      routes: fallbackStore.getRoutes(),
      journey: fallbackStore.getJourney(),
    } as T;
  }
  if (path === '/havens/nearby' && method === 'POST') {
    return fallbackStore.getHavens() as T;
  }
  if (path === '/geo/search' && method === 'GET') {
    return {
      results: [
        { name: 'Indiranagar 100ft Road', display_name: 'Indiranagar 100ft Road, Bengaluru', lat: 12.9716, lng: 77.6412, type: 'commercial' },
        { name: 'Electronic City Phase 1', display_name: 'Electronic City Phase 1, Bengaluru', lat: 12.8452, lng: 77.6602, type: 'tech_hub' },
        { name: 'MG Road Metro Station', display_name: 'MG Road Metro Station, Bengaluru', lat: 12.9756, lng: 77.6066, type: 'transit' },
      ],
    } as T;
  }

  throw new Error(`Unhandled fallback endpoint: ${url}`);
}
