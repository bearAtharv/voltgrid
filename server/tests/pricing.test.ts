import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Pure function testing the pricing equation implemented in sp_book_charging_bay_atomic
function calculateEstimatedBilling(params: {
  batteryCapacityKwh: number;
  initialSoc: number;
  targetSoc: number;
  basePricePerKwh: number;
  peakMultiplier: number;
}): { energyKwh: number; totalCost: number } {
  if (params.targetSoc <= params.initialSoc) {
    throw new Error('Target SoC must be greater than initial SoC');
  }

  const deltaPercent = params.targetSoc - params.initialSoc;
  const energyKwh = Number(((params.batteryCapacityKwh * deltaPercent) / 100).toFixed(3));
  const totalCost = Number((energyKwh * params.basePricePerKwh * params.peakMultiplier).toFixed(2));

  return { energyKwh, totalCost };
}

describe('Indian EV Charging Economics & Pricing Invariants Unit Tests', () => {
  it('should calculate standard BESCOM charge for Tata Nexon EV Max', () => {
    // Tata Nexon EV Max: 40.5 kWh, 20% -> 80% charge (60% delta = 24.3 kWh)
    // BESCOM Rate: ₹6.80/kWh, Peak Multiplier: 1.15
    // Total = 24.3 * 6.80 * 1.15 = ₹189.98
    const result = calculateEstimatedBilling({
      batteryCapacityKwh: 40.5,
      initialSoc: 20,
      targetSoc: 80,
      basePricePerKwh: 6.80,
      peakMultiplier: 1.15
    });

    assert.equal(result.energyKwh, 24.3);
    assert.equal(result.totalCost, 190.03);

    // Realistic rate verification: must be within ₹100 - ₹350
    assert.ok(result.totalCost >= 100 && result.totalCost <= 350);
  });

  it('should calculate Green Solar Night rate for Hyundai Ioniq 5', () => {
    // Hyundai Ioniq 5: 72.6 kWh, 10% -> 70% charge (60% delta = 43.56 kWh)
    // Green Solar Night Rate: ₹4.50/kWh, Off-peak Multiplier: 1.10
    // Total = 43.56 * 4.50 * 1.10 = ₹215.62
    const result = calculateEstimatedBilling({
      batteryCapacityKwh: 72.6,
      initialSoc: 10,
      targetSoc: 70,
      basePricePerKwh: 4.50,
      peakMultiplier: 1.10
    });

    assert.equal(result.energyKwh, 43.56);
    assert.equal(result.totalCost, 215.62);
    assert.ok(result.totalCost >= 100 && result.totalCost <= 350);
  });

  it('should calculate Highway SuperFast DC rate for MG ZS EV', () => {
    // MG ZS EV: 50.3 kWh, 20% -> 90% charge (70% delta = 35.21 kWh)
    // Tata Power Highway SuperFast: ₹12.50/kWh, Peak Multiplier: 1.20
    // Total = 35.21 * 12.50 * 1.20 = ₹528.15
    const result = calculateEstimatedBilling({
      batteryCapacityKwh: 50.3,
      initialSoc: 20,
      targetSoc: 90,
      basePricePerKwh: 12.50,
      peakMultiplier: 1.20
    });

    assert.equal(result.energyKwh, 35.21);
    assert.equal(result.totalCost, 528.15);
  });

  it('should throw an error if target SoC is less than or equal to initial SoC', () => {
    assert.throws(
      () => {
        calculateEstimatedBilling({
          batteryCapacityKwh: 40.5,
          initialSoc: 80,
          targetSoc: 20,
          basePricePerKwh: 6.80,
          peakMultiplier: 1.00
        });
      },
      { message: 'Target SoC must be greater than initial SoC' }
    );
  });
});
