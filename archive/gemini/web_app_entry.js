/**
 * Apex AMC - Internal Ballistics & Ladder Calculation Engine
 */

// Sample Published Recipe
const sampleRecipe = {
  cartridge: ".308 Winchester",
  bullet: "168gr HPBT",
  powder: "I4064",
  testBarrelLength: 24, // inches
  publishedCOAL: 2.800, // inches
  minChargeGrains: 41.5,
  minFPS: 2450,
  maxChargeGrains: 45.0,
  maxFPS: 2700,
  maxPSI: 60000,
  burnRateClass: "rifle_medium" // exponent n ~ 0.22
};

function calculateReloadingLadder(recipe, userInputs) {
  const { userBarrelLength, userTargetCOAL, stepsCount = 5 } = userInputs;

  // 1. Exponent Selection for Barrel Scaling
  const exponentMap = {
    pistol: 0.15,
    rifle_medium: 0.22,
    rifle_slow: 0.29
  };
  const n = exponentMap[recipe.burnRateClass] || 0.22;

  // 2. Barrel Length Scaling Factor
  const barrelRatio = userBarrelLength / recipe.testBarrelLength;
  const fpsScaleFactor = Math.pow(barrelRatio, n);

  // 3. COAL Pressure Warning Check
  let coalWarning = null;
  if (userTargetCOAL < recipe.publishedCOAL) {
    const diff = (recipe.publishedCOAL - userTargetCOAL).toFixed(3);
    coalWarning = `WARNING: Target COAL is ${diff}" shorter than published COAL (${recipe.publishedCOAL}"). Seating deeper decreases internal volume and increases peak chamber pressure sharply! Start below minimum charge.`;
  }

  // 4. Generate Ladder Steps
  const stepIncrement = (recipe.maxChargeGrains - recipe.minChargeGrains) / (stepsCount - 1);
  const fpsIncrement = (recipe.maxFPS - recipe.minFPS) / (stepsCount - 1);

  const ladder = [];
  for (let i = 0; i < stepsCount; i++) {
    const currentCharge = recipe.minChargeGrains + (stepIncrement * i);
    const baseFPS = recipe.minFPS + (fpsIncrement * i);
    const estimatedFPS = Math.round(baseFPS * fpsScaleFactor);

    ladder.push({
      step: i + 1,
      chargeGrains: Number(currentCharge.toFixed(1)),
      estimatedFPS: estimatedFPS,
      isMax: i === stepsCount - 1
    });
  }

  return {
    cartridge: recipe.cartridge,
    bullet: recipe.bullet,
    powder: recipe.powder,
    publishedCOAL: recipe.publishedCOAL,
    targetCOAL: userTargetCOAL,
    testBarrelLength: recipe.testBarrelLength,
    userBarrelLength: userBarrelLength,
    coalWarning: coalWarning,
    ladder: ladder
  };
}

// Example Run:
const result = calculateReloadingLadder(sampleRecipe, {
  userBarrelLength: 18, // 18-inch barrel instead of 24-inch
  userTargetCOAL: 2.780, // Slightly shorter seating depth
  stepsCount: 5
});

console.log(result);