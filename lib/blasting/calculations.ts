// lib/blasting/calculations.ts

export interface DesignInputs {
  numberOfHoles: number;
  holeDepthM: number;
  holeDiameterMM: number;
  chargingLengthM: number;
  explosiveDensityKgPerM3: number;
  spacingM: number;
  burdenM: number;
  benchHeightM: number;
  materialDensityTPerM3: number;
  bagsOfAnfo: number;
  boxesOfExplosives: number;
  explosiveCostPerKg: number;
  detonatorCostPerPiece: number;
  detonatorNumber: number;
  initiationCost: number;
  drillingCostPerM: number;
  laborCostPerHole: number;
  accessoriesCost: number;
}

export interface DesignCalculations {
  volumePerHoleM3: number;
  totalVolumeM3: number;
  requiredExplosiveKg: number;
  availableExplosiveKg: number;
  differenceKg: number;
  isSufficient: boolean;
  shortageKg: number;
  excessKg: number;
  totalBlastVolumeM3: number;
  tonnageT: number;
  explosiveCostTzs: number;
  drillingCostTzs: number;
  laborCostTzs: number;
  detonatorCostTzs: number;
  totalCostTzs: number;
  powderFactorKgPerT: number;
  costPerTonneTzs: number;
}

export function calculateDesignMetrics(inputs: DesignInputs): DesignCalculations {
  const {
    numberOfHoles,
    holeDepthM,
    holeDiameterMM,
    chargingLengthM,
    explosiveDensityKgPerM3,
    spacingM,
    burdenM,
    benchHeightM,
    materialDensityTPerM3,
    bagsOfAnfo,
    boxesOfExplosives,
    explosiveCostPerKg,
    detonatorCostPerPiece,
    detonatorNumber,
    initiationCost,
    drillingCostPerM,
    laborCostPerHole,
    accessoriesCost
  } = inputs;

  // Volume calculations
  const radiusM = holeDiameterMM / 2000;
  const volumePerHoleM3 = Math.PI * Math.pow(radiusM, 2) * chargingLengthM;
  const totalVolumeM3 = volumePerHoleM3 * numberOfHoles;
  const requiredExplosiveKg = totalVolumeM3 * explosiveDensityKgPerM3;

  // Stock calculations
  const availableExplosiveKg = (bagsOfAnfo + boxesOfExplosives) * 25;
  const differenceKg = availableExplosiveKg - requiredExplosiveKg;
  const isSufficient = differenceKg >= 0;
  const shortageKg = isSufficient ? 0 : Math.abs(differenceKg);
  const excessKg = isSufficient ? differenceKg : 0;

  // Blast volume and tonnage
  const totalBlastVolumeM3 = numberOfHoles * spacingM * burdenM * benchHeightM;
  const tonnageT = totalBlastVolumeM3 * materialDensityTPerM3;

  // Cost calculations
  const explosiveCostTzs = availableExplosiveKg * explosiveCostPerKg;
  const drillingCostTzs = (numberOfHoles * holeDepthM) * drillingCostPerM;
  const laborCostTzs = numberOfHoles * laborCostPerHole;
  const detonatorCostTzs = detonatorNumber * detonatorCostPerPiece;
  const totalCostTzs = explosiveCostTzs + drillingCostTzs + laborCostTzs + detonatorCostTzs + initiationCost + accessoriesCost;

  // Metrics
  const powderFactorKgPerT = tonnageT > 0 ? requiredExplosiveKg / tonnageT : 0;
  const costPerTonneTzs = tonnageT > 0 ? totalCostTzs / tonnageT : 0;

  return {
    volumePerHoleM3,
    totalVolumeM3,
    requiredExplosiveKg,
    availableExplosiveKg,
    differenceKg,
    isSufficient,
    shortageKg,
    excessKg,
    totalBlastVolumeM3,
    tonnageT,
    explosiveCostTzs,
    drillingCostTzs,
    laborCostTzs,
    detonatorCostTzs,
    totalCostTzs,
    powderFactorKgPerT,
    costPerTonneTzs
  };
}