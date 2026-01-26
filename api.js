/* api.js */

export const Api = {
  async computeFare({ mode, distanceKm }) {
    const rounded = Math.round(distanceKm * 1000) / 1000;
    let fare;

    if (mode === 'trike') {
      // Ordinance-based fare: ₱15 for first 4 km, then ₱1/km
      fare = rounded <= 4 ? 15 : 15 + Math.ceil(rounded - 4) * 1;
    } else if (mode === 'bus' || mode === 'jeep') {
      // Flat fare for all bus/jeep rides inside GenSan
      fare = 20;
    } else {
      throw new Error('Unsupported mode');
    }

    // Simulate async delay for consistency
    await new Promise(r => setTimeout(r, 200));
    return { mode, distanceKm: rounded, fare };
  }
};