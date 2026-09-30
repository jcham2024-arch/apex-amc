/**
 * Evaluates group characteristics against firearm profile limits
 */
export const diagnoseFirearmPerformance = (firearm, groupStats, shotTimestamps = []) => {
  const insights = [];

  // 1. Heavy Trigger Check
  if (firearm.trigger_pull_weight_lbs >= 3.5 && groupStats.horizontalSpread > groupStats.verticalSpread * 1.5) {
    insights.push({
      type: 'MECHANICS_WARNING',
      severity: 'MEDIUM',
      message: `Horizontal group spread (${groupStats.horizontalSpread}") exceeds vertical spread. Your ${firearm.trigger_pull_weight_lbs}lb trigger pull may be causing side-torquing during trigger break.`
    });
  }

  // 2. Barrel Heat / Contour Check
  if (firearm.barrel_contour === 'Pencil' && shotTimestamps.length >= 5) {
    insights.push({
      type: 'THERMAL_DRIFT',
      severity: 'LOW',
      message: `Pencil contour detected. Expect POI migration if firing long strings without allowing the barrel to cool.`
    });
  }

  // 3. Elevation Limit Check
  const effectiveElevationUp = (firearm.total_elevation_travel_units / 2) + firearm.mount_cant_units;
  if (effectiveElevationUp < 30 && firearm.scope_click_unit === 'MOA') {
    insights.push({
      type: 'HARDWARE_LIMIT',
      severity: 'INFO',
      message: `With ${firearm.mount_cant_units} MOA base cant, you have ~${effectiveElevationUp} MOA usable up-travel. Consider a 20 MOA base for ultra-long-range dial corrections.`
    });
  }

  return insights;
};