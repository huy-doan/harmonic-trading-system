// 048. src/infrastructure/database/seeds/harmonic-ratios.seed.ts
export const HARMONIC_RATIOS = {
    GARTLEY: {
      XAB: { min: 0.586, ideal: 0.618, max: 0.648 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 1.13, ideal: 1.272, max: 1.618 },
      XAD: { min: 0.766, ideal: 0.786, max: 0.806 },
    },
    BUTTERFLY: {
      XAB: { min: 0.766, ideal: 0.786, max: 0.806 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 1.618, ideal: 2.24, max: 2.618 },
      XAD: { min: 1.17, ideal: 1.27, max: 1.618 },
    },
    BAT: {
      XAB: { min: 0.382, ideal: 0.5, max: 0.618 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 1.618, ideal: 2.0, max: 2.618 },
      XAD: { min: 0.866, ideal: 0.886, max: 0.906 },
    },
    CRAB: {
      XAB: { min: 0.382, ideal: 0.5, max: 0.618 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 2.618, ideal: 3.14, max: 3.618 },
      XAD: { min: 1.618, ideal: 1.618, max: 1.618 },
    },
    CYPHER: {
      XAB: { min: 0.382, ideal: 0.5, max: 0.618 },
      ABC: { min: 1.272, ideal: 1.414, max: 1.618 },
      BCD: { min: 0.786, ideal: 0.786, max: 0.786 },
      XAD: { min: 0.786, ideal: 0.786, max: 0.786 },
    },
  };
  