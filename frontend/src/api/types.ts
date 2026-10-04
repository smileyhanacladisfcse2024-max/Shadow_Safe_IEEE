export interface Segment {
  t: string;
  b?: boolean;
}

export interface TripInfo {
  line_label: string;
  line_short: string;
  status_chip: string;
  origin: string;
  destination: string;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  eta_minutes: number;
  eta_clock: string;
  distance_km: number;
  lighting_lux: number;
  lighting_label: string;
  crowd_label: string;
  polyline?: [number, number][];
  is_real_route?: boolean;
}

export interface VehicleInfo {
  x_m: number;
  y_m: number;
  speed_kmh: number;
  heading: string;
  idle_s: number;
}

export interface CorridorInfo {
  deviation_m: number;
  divergence_point: { x_m: number; y_m: number };
  street_label: string;
}

export interface RiskSummary {
  score: number;
  band: string;
  badge: string;
  headline: string;
  explanation: Segment[];
}

export interface AlertInfo {
  id: string;
  severity: string;
  message: Segment[];
  dismissed: boolean;
}

export interface GuardiansSummary {
  connected: number;
  names: string[];
  status: string;
  sharing_text: string;
}

export interface HavenNearbyItem {
  id: string;
  name: string;
  icon: string;
  distance_m: number;
  note: string;
  x_m: number;
  y_m: number;
  lat?: number;
  lng?: number;
  phone?: string;
  walk_min?: number;
  direction?: string;
}

export interface HavensNearbySummary {
  count_within_500m: number;
  items: HavenNearbyItem[];
}

export interface SensorsInfo {
  gps_accuracy_m: number;
  cell_signal: string;
  audio_anomaly: number;
}

export interface SOSSummary {
  state: string;
}

export interface JourneySnapshot {
  trip_id: string;
  session_id: string;
  stage: number;
  evaluated_at: string;
  user_profile?: UserProfile;
  trip: TripInfo;
  vehicle: VehicleInfo;
  corridor: CorridorInfo;
  risk: RiskSummary;
  alert: AlertInfo | null;
  guardians: GuardiansSummary;
  havens_nearby: HavensNearbySummary;
  sensors: SensorsInfo;
  sos: SOSSummary;
}

export interface EngineInfo {
  label: string;
  version: string;
  evaluated_at: string;
}

export interface Driver {
  id: string;
  label: string;
  points: number;
  share_pct: number;
}

export interface NearestHaven {
  id: string;
  name: string;
  distance_m: number;
  direction: string;
  note: string;
}

export interface CorridorDetail {
  current_label: string;
  delta_label: string;
}

export interface DwellDetail {
  dot_congestion_pct: number;
  scheduled_stops: number;
  speed_kmh: number;
  accuracy_m: number;
}

export interface AdvisoryDetail {
  source: string;
  age_min: number;
  corroboration_label: string;
}

export interface EnvironmentQuadrant {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

export interface EnvironmentDetail {
  quadrants: EnvironmentQuadrant[];
}

export interface FactorCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  points: number;
  impact_label: string;
  narrative: Segment[];
  confidence_pct: number;
  trace: string;
  corridor?: CorridorDetail | null;
  dwell?: DwellDetail | null;
  advisory?: AdvisoryDetail | null;
  environment?: EnvironmentDetail | null;
}

export interface RiskReport {
  engine: EngineInfo;
  score: number;
  band: string;
  label: string;
  safe_threshold: number;
  disclaimer: string;
  weights: Record<string, number>;
  drivers: Driver[];
  factors: FactorCard[];
  nearest_haven: NearestHaven;
}

export interface RouteChip {
  icon: string;
  label: string;
}

export interface RouteMetric {
  label: string;
  detail: string;
}

export interface RouteOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  time_min: number;
  time_delta: string;
  concern: number;
  distance_km?: number;
  safety_score?: number;
  polyline?: [number, number][];
  chips: RouteChip[];
  metrics: RouteMetric[];
  selected: boolean;
}

export interface AutoReroute {
  enabled: boolean;
  threshold: number;
  standing_by: boolean;
}

export interface RoutesResponse {
  headline: string;
  subtitle: string;
  options: RouteOption[];
  selected_route_id: string;
  auto_reroute: AutoReroute;
}

export interface Guardian {
  id: string;
  name: string;
  relation: string;
  kind: string;
  battery_pct: number | null;
  status_text: string;
  location_shared: boolean;
  priority_link: boolean;
}

export interface EmergencyLine {
  name: string;
  tel: string;
  tag: string;
}

export interface ImmediateHaven {
  id: string;
  name: string;
  distance_m: number;
  walk_min: number;
  direction: string;
  phone: string | null;
}

export interface ProtectionState {
  state: string;
  title: string;
  subtitle: string;
}

export interface GuardiansResponse {
  trip_id: string;
  protection: ProtectionState;
  grace_s: number;
  silent_escort: { enabled: boolean; interval_s: number };
  guardians: Guardian[];
  active_count: number;
  immediate_haven: ImmediateHaven | null;
  emergency_lines: EmergencyLine[];
}

export interface GuardianAddRequest {
  name: string;
  relation: string;
  phone: string;
}

export interface SOSStatus {
  state: string;
  deadline_at?: string | null;
  server_time?: string | null;
  grace_s?: number | null;
}

export interface SOSArmResponse {
  state: string;
  deadline_at: string;
  server_time: string;
  grace_s: number;
}

export interface HavenCapability {
  icon: string;
  label: string;
}

export interface Haven {
  id: string;
  name: string;
  address: string;
  icon: string;
  tags: string[];
  x_m: number;
  y_m: number;
  hours: string;
  closes_at: string | null;
  cctv_cameras: number | null;
  lux: number | null;
  capabilities: HavenCapability[];
  phone: string | null;
  direction: string;
  distance_m: number;
  walk_min: number;
  note: string;
}

export interface HavenMesh {
  label: string;
  nodes_in_range: number;
}

export interface FilterCounts {
  all: number;
  staffed: number;
  transit: number;
  medical: number;
  beacon: number;
}

export interface HavenSpotlight {
  id: string;
  name: string;
  address: string;
  distance_m: number;
  walk_min: number;
  direction: string;
  tags: string[];
  cctv_cameras: number | null;
  lux: number | null;
  capabilities: HavenCapability[];
  phone: string | null;
  note: string;
}

export interface HavensResponse {
  mesh: HavenMesh;
  counts: FilterCounts;
  filter: string;
  spotlight: HavenSpotlight;
  items: Haven[];
}

export interface HavenActionResponse {
  message: string;
  haven_id: string;
  extra?: Record<string, unknown> | null;
}

export interface PolicyItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface ComplianceBadge {
  icon: string;
  label: string;
}

export interface PrivacyResponse {
  session_id: string;
  storage: string;
  cipher: string;
  bytes_held: number;
  policies: PolicyItem[];
  compliance_badges: ComplianceBadge[];
}

export interface PurgeResponse {
  purged: boolean;
  bytes_held: number;
  cleared: Record<string, unknown>;
}

export interface StageInfo {
  id: number;
  name: string;
  subtitle: string;
  score: number;
  active: boolean;
}

export interface DemoStagesResponse {
  active_stage: number;
  stages: StageInfo[];
}

export interface TelemetryMockResponse {
  journey: JourneySnapshot;
  risk_score: number;
  band: string;
  latency_ms: number;
}

export interface DemoResetResponse {
  message: string;
  active_stage: number;
}

export interface SharedRouteResponse {
  trip_id: string;
  position: { x_m: number; y_m: number };
  risk_score: number;
  band: string;
  heading: string;
  timestamp: string;
}

export interface LiveRouteShareResult {
  url: string;
  token: string;
  passcode: string;
  expires_at: string;
}

export interface GuardianContact {
  name: string;
  phone: string;
  relation: string;
  notify_on_deviation?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  blood_group: string;
  home_address: string;
  home_lat?: number;
  home_lng?: number;
  work_address: string;
  work_lat?: number;
  work_lng?: number;
  primary_guardian: GuardianContact;
  secondary_guardian: GuardianContact;
  medical_notes: string;
  emergency_code: string;
  is_authenticated: boolean;
  onboarding_completed: boolean;
}

export interface PlaceSearchResult {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  type: string;
}

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface CalculateRouteRequest {
  origin: LocationPoint;
  destination: LocationPoint;
}

export interface CalculateRouteResponse {
  message: string;
  routes: RoutesResponse;
  journey: JourneySnapshot;
}

