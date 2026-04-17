// lib/types.ts - COMPLETE VERSION

// ========== USER & COMPANY TYPES ==========
export interface Company {
  id: string
  name: string
  logo_url?: string
  address?: string
  contact_email?: string
  contact_phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  company_id?: string
  full_name: string
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'FINANCE_ACCOUNTANT' | 'SAFETY_OFFICER' | 'OPERATOR'
  position: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  description?: string
  location_lat?: number
  location_lng?: number
  region?: string
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'PLANNING'
  budget?: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

// ========== FLEET TYPES ==========
export type VehicleStatus = 'operational' | 'maintenance' | 'breakdown' | 'retired'

export interface Vehicle {
  id: string
  company_id: string
  vehicle_number: string
  vehicle_type: string
  make?: string
  model?: string
  year?: number
  status: VehicleStatus
  region?: string
  current_location?: string
  fuel_capacity?: number
  odometer_reading?: number
  next_maintenance_date?: string
  tracking_method?: 'PHONE_GPS' | 'HARDWARE_TRACKER'
  tracker_device_id?: string
  tracker_protocol?: string
  created_at: string
  updated_at: string
}

export interface SparePart {
  id: string
  company_id: string
  item_code: string // Standardized
  name: string
  category?: string
  manufacturer?: string
  compatible_vehicle_models?: string[]
  current_stock: number
  minimum_stock: number
  unit_cost: number
  location?: string
  unit: string // Added
  supplier?: string // Added
  batch_number?: string // Added
  last_updated?: string // Added
  notes?: string
  created_at: string
  updated_at: string
}

// ========== FUEL & MAINTENANCE TYPES ==========
export interface FuelLog {
  id: string
  company_id: string
  fleet_vehicle_id: string
  driver_id?: string
  log_date_time: string
  location?: string
  fuel_type: string
  quantity: number
  cost_per_liter: number
  total_cost: number
  odometer_reading?: number
  notes?: string
  reporter_signature?: string
  supervisor_signature?: string
  manager_signature?: string
  created_at: string
}

export interface MaintenanceLog {
  id: string
  company_id: string
  fleet_vehicle_id: string
  maintenance_date: string
  maintenance_type: string
  description: string
  cost: number
  performed_by?: string
  next_service_date?: string
  next_service_odometer?: number
  odometer_reading?: number
  reporter_signature?: string
  supervisor_signature?: string
  manager_signature?: string
  created_at: string
}

// ========== BLASTING TYPES ==========
export interface BlastingOperation {
  id: string
  company_id: string
  project_id?: string
  blast_number: string
  region?: string
  location?: string
  bench_no?: string
  design_date?: string
  execution_date?: string
  execution_time?: string
  analysis_date?: string
  current_phase: 'design' | 'execution' | 'analysis' | 'completed'
  status: 'planned' | 'approved' | 'executed' | 'analyzed' | 'completed' | 'cancelled'
  
  // Design Parameters
  number_of_holes: number
  spacing_m: number
  burden_m: number
  hole_depth_m: number
  hole_diameter_mm: number
  bench_height_m: number
  charging_length_m: number
  stemming_length_m: number
  subdrill_length_m: number
  
  // Explosives
  explosive_type: string
  bags_of_anfo_planned: number
  boxes_of_explosives_planned: number
  bags_of_anfo_actual: number
  boxes_of_explosives_actual: number
  explosive_quantity_kg_actual: number
  
  // Initiation
  detonator_type: string
  detonator_number_planned: number
  detonator_number_actual: number
  booster_number_planned: number
  booster_number_actual: number
  
  // Costs
  explosive_cost_per_kg: number
  detonator_cost_per_piece: number
  initiation_cost: number
  drilling_cost_per_m: number
  labor_cost_per_hole: number
  accessories_cost: number
  
  // Calculated
  required_explosive_kg_planned: number
  available_explosive_kg_planned: number
  tonnage_t_planned: number
  planned_budget_tzs: number
  actual_cost_tzs: number
  cost_per_tonne_tzs: number
  
  // Execution Data
  blaster_name?: string
  gps_latitude?: number
  gps_longitude?: number
  vibration_mm_s?: number
  airblast_db?: number
  distance_from_structure_m?: number
  vibration_compliant: boolean
  airblast_compliant: boolean
  
  // Signatures
  blaster_signature?: string
  blaster_signed_at?: string
  supervisor_signature?: string
  supervisor_signed_at?: string
  manager_signature?: string
  manager_signed_at?: string
  
  // Media
  photo_urls: string[]
  
  created_by?: string
  created_at: string
  updated_at: string
}

// ========== DRILLING TYPES ==========
export interface DrillingOperation {
  id: string
  company_id: string
  project_id?: string
  drill_number: string
  region?: string
  location?: string
  date?: string
  shift?: string
  driller_name?: string
  current_phase: 'design' | 'execution' | 'analysis' | 'completed'
  status: 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  
  // Parameters
  holes_drilled: number
  hole_length_m: number
  hole_diameter_mm: number
  total_depth_m: number
  total_time_minutes: number
  downtime_minutes: number
  downtime_reason?: string
  
  // Mechanical
  rpm?: number
  torque_nm?: number
  weight_on_bit_n?: number
  penetration_rate_m_per_min: number
  
  // Geotechnical
  rock_type?: string
  rock_strength?: string
  
  // Consumables
  fuel_consumption_l: number
  bits_used: number
  rods_used: number
  
  // Costs
  drilling_cost_per_m: number
  planned_budget_tzs: number
  total_drilling_cost_tzs: number
  actual_cost_tzs: number
  cost_per_meter_tzs: number
  
  // Signatures
  driller_signature?: string
  driller_signed_at?: string
  supervisor_signature?: string
  supervisor_signed_at?: string
  manager_signature?: string
  manager_signed_at?: string
  
  photo_urls: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

// ========== DIAMOND DRILLING TYPES ==========
export interface DiamondDrillingOperation {
  id: string
  company_id: string
  project_id?: string
  campaign_id: string
  hole_number: string
  region?: string
  location?: string
  date?: string
  shift?: string
  drill_rig_number?: string
  current_phase: 'design' | 'execution' | 'analysis' | 'completed'
  status: 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  
  // Core Parameters
  core_size: string
  core_diameter_mm: number
  target_depth_meters: number
  actual_depth_meters: number
  core_recovered_meters: number
  recovery_percentage: number
  target_recovery_percentage: number
  
  // Time
  drilling_time_hours: number
  downtime_hours: number
  penetration_rate_m_per_h: number
  
  // Personnel
  driller_name?: string
  geologist_name?: string
  
  // Sample
  sample_collected: boolean
  sample_bags_count: number
  sample_interval_start_m?: number
  sample_interval_end_m?: number
  sample_notes?: string
  
  // Costs
  contract_cost_per_m: number
  core_barrel_cost_per_run: number
  bit_cost_per_piece: number
  drilling_fluid_cost_per_l: number
  lab_analysis_cost_per_sample: number
  mobilization_cost: number
  planned_budget_tzs: number
  actual_cost_tzs: number
  cost_per_meter_tzs: number
  
  // Geological
  lithology?: string
  mineralization?: string
  alteration?: string
  structural_features?: string
  
  // Signatures
  driller_signature?: string
  driller_signed_at?: string
  geologist_signature?: string
  geologist_signed_at?: string
  manager_signature?: string
  manager_signed_at?: string
  
  photo_urls: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

// ========== MATERIAL HANDLING TYPES ==========
export interface MaterialHandlingOperation {
  id: string
  company_id: string
  operation_number: string
  region?: string
  location?: string
  date?: string
  day?: string
  current_phase: 'design' | 'execution' | 'analysis' | 'completed'
  status: 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  
  // Fleet Data
  operator_names?: string
  machines?: string
  truck_capacity_tonnes: number
  trips_per_day: number
  total_trucks: number
  
  // Operational Data
  total_fuel_consumed_l: number
  total_distance_km: number
  downtime_hours: number
  downtime_reason?: string
  
  // Calculations
  production_per_day_tonnes: number
  fuel_efficiency_km_per_l: number
  
  // Costs
  planned_budget_tzs: number
  cost_per_tonne_tzs: number
  total_cost: number
  
  // Observations
  challenges?: string
  recommendations?: string
  
  // Signatures
  operator_signature?: string
  operator_signed_at?: string
  supervisor_signature?: string
  supervisor_signed_at?: string
  manager_signature?: string
  manager_signed_at?: string
  
  photo_urls: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

// ========== SAFETY TYPES ==========
export interface SafetyIncident {
  id: string
  company_id: string
  incident_number: string
  title: string
  incident_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'INVESTIGATING' | 'CLOSED'
  incident_date: string
  incident_time?: string
  location?: string
  description?: string
  equipment_involved?: string
  witnesses?: string
  injury_type?: string
  body_part?: string
  medical_treatment_required: boolean
  days_lost: number
  reporter_name?: string
  root_cause?: string
  corrective_actions?: string
  
  // Signatures
  reporter_signature?: string
  reporter_signed_at?: string
  supervisor_signature?: string
  supervisor_signed_at?: string
  manager_signature?: string
  manager_signed_at?: string
  
  photo_urls: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

// ========== INVENTORY TYPES ==========
export interface InventoryItem {
  id: string
  company_id: string
  item_code: string
  item_name: string
  category: 'SPARE_PARTS' | 'DRILLING' | 'BLASTING' | 'DIAMOND_DRILLING' | 'GENERAL'
  unit: string
  current_stock: number
  minimum_stock: number
  cost_per_unit: number
  supplier?: string
  location?: string
  expiration_date?: string
  batch_number?: string // Added
  last_updated?: string // Added
  notes?: string
  qr_code_url?: string
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  company_id: string
  item_id: string
  item_code: string
  type: 'IN' | 'OUT'
  quantity: number
  date: string
  module: 'BLASTING' | 'DRILLING' | 'DIAMOND_DRILLING' | 'FLEET' | 'GENERAL'
  reference_id?: string // e.g., blast_number
  user_id: string
  user_name?: string
  notes?: string
  created_at: string
}

// ========== BILLING TYPES ==========
export interface Invoice {
  id: string
  company_id: string
  project_id?: string
  invoice_number: string
  client_name: string
  client_address?: string
  client_email?: string
  issue_date: string
  due_date?: string
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  payment_terms?: string
  bank_details?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  source_module?: string
  source_id?: string
  created_at: string
}

// ========== FINANCE & EXPENSE TYPES ==========
export interface Expense {
  id: string
  company_id: string
  category: 'fuel' | 'maintenance' | 'labor' | 'explosives' | 'spare_parts' | 'miscellaneous'
  amount: number
  log_date: string
  module_source: string
  description?: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected'
  recorded_by?: string
  approved_by?: string
  created_at: string
}

// ========== QUARRY TYPES ==========
export interface EquipmentInspection {
  id: string
  company_id: string
  machine_name?: string
  inspection_date: string
  shift: 'DAY' | 'NIGHT'
  fuel_amount_liters: number
  hydraulic_oil_liters: number
  hour_meter_start: number
  hour_meter_stop: number
  bin_tip_start: number
  bin_tip_stop: number
  total_hours_manual: number
  total_trips_manual: number
  checklist_items: any[]
  operator_comments?: string
  supervisor_comments?: string
  operator_name?: string
  operator_signature?: string
  amogtech_supervisor_name?: string
  amogtech_signature?: string
  tcplc_supervisor_name?: string
  tcplc_signature?: string
  operator_id?: string
  created_at: string
}

export interface EquipmentPayload {
  id: string
  company_id: string
  machine_name?: string
  machine_type?: string
  payload_date: string
  shift: 'DAY' | 'NIGHT'
  operator_name?: string
  trips: any[]
  last_completed_trip: number
  total_tonnage: number
  average_tonnage: number
  efficiency_percentage: number
  entry_mode: 'manual' | 'auto'
  operator_comments?: string
  supervisor_comments?: string
  operator_signature?: string
  amogtech_supervisor_name?: string
  amogtech_signature?: string
  tcplc_supervisor_name?: string
  tcplc_signature?: string
  is_completed: boolean
  created_by?: string
  created_at: string
}

// ========== TELEMETRY TYPES ==========
export interface VehicleTelemetry {
  id: string
  vehicle_id: string
  latitude: number
  longitude: number
  speed_mps: number
  heading?: number
  recorded_at: string
  created_at: string
}

// ========== UTILITY TYPES ==========
export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalProjects: number
  activeProjects: number
  totalEquipment: number
  operationalEquipment: number
  maintenanceEquipment: number
  breakdownEquipment: number
  totalProduction: number
  productionTarget: number
  safetyScore: number
  signatureCompliance: number
  totalBlasts: number
  totalDrilling: number
  totalTonnage: number
  totalCost: number
  budgetUtilization: number
}

export interface RecentActivity {
  id: number
  type: 'blast' | 'drilling' | 'safety' | 'inventory' | 'production'
  title: string
  time: string
  status: 'success' | 'warning' | 'danger' | 'info'
  user: string
}

export interface ModulePerformance {
  name: string
  value: number
  color: string
  icon: string
}

export interface ProductionData {
  date: string
  production: number
  target: number
  efficiency: number
}