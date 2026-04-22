export type HeightUnit = "cm" | "ft_in";
export type WeightUnit = "kg" | "lb";

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

export function cmToFeetInches(heightCm: number) {
  const totalInches = heightCm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

export function kgToLb(weightKg: number) {
  return weightKg / KG_PER_LB;
}

export function formatHeight(heightCm: number, unit: HeightUnit) {
  if (unit === "cm") {
    return `${Math.round(heightCm * 10) / 10} cm`;
  }
  const converted = cmToFeetInches(heightCm);
  return `${converted.feet}'${converted.inches}"`;
}

export function formatWeight(weightKg: number, unit: WeightUnit) {
  if (unit === "kg") {
    return `${Math.round(weightKg * 10) / 10} kg`;
  }
  const pounds = Math.round(kgToLb(weightKg) * 10) / 10;
  return `${pounds} lb`;
}
