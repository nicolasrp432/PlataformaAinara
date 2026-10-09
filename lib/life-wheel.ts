import type { z } from "zod";
import type { lifeWheelSchema } from "@/lib/validations/life-wheel";

export const LIFE_AREAS = [
  {
    key: "health",
    label: "Salud y energía",
    question: "¿Cómo te sientes en tu cuerpo y cuánto cuidas tu descanso?",
    color: "#0F766E",
  },
  {
    key: "relationships",
    label: "Amor y vínculos",
    question: "¿Tus relaciones te permiten sentir conexión y ser tú?",
    color: "#BE4568",
  },
  {
    key: "family",
    label: "Familia y amistad",
    question: "¿Encuentras apoyo y tiempo para las personas que te importan?",
    color: "#B45309",
  },
  {
    key: "work",
    label: "Trabajo y propósito",
    question: "¿Lo que haces tiene sentido para ti en este momento?",
    color: "#4867B0",
  },
  {
    key: "money",
    label: "Economía",
    question:
      "¿Cómo vives tu relación con el dinero y tu tranquilidad económica?",
    color: "#527A35",
  },
  {
    key: "growth",
    label: "Crecimiento personal",
    question: "¿Tienes espacio para aprender y conocerte mejor?",
    color: "#8757A6",
  },
  {
    key: "leisure",
    label: "Disfrute y descanso",
    question: "¿Hay lugar para el juego, el descanso y aquello que disfrutas?",
    color: "#B36716",
  },
  {
    key: "environment",
    label: "Entorno y hogar",
    question: "¿Tu espacio cotidiano te ayuda a sentir bienestar?",
    color: "#327B94",
  },
] as const;
export type LifeAreaKey = (typeof LIFE_AREAS)[number]["key"];
export type LifeWheelInput = z.infer<typeof lifeWheelSchema>;
export type LifeWheelEntry = LifeWheelInput & {
  id: string;
  created_at: string;
};
export const INITIAL_SCORES: LifeWheelInput["scores"] = {
  health: 5,
  relationships: 5,
  family: 5,
  work: 5,
  money: 5,
  growth: 5,
  leisure: 5,
  environment: 5,
};
export function wheelAverage(scores: LifeWheelInput["scores"]) {
  return (
    LIFE_AREAS.reduce((sum, area) => sum + scores[area.key], 0) /
    LIFE_AREAS.length
  );
}
export function selectLifeWheelEntry(entries: LifeWheelEntry[], id: string) {
  return entries.find((entry) => entry.id === id) ?? null;
}

export function lifeWheelHighlights(scores: LifeWheelInput["scores"]) {
  const ordered = [...LIFE_AREAS].sort((a, b) => scores[a.key] - scores[b.key]);
  return { attention: ordered[0], strength: ordered[ordered.length - 1] };
}
export function scoreChange(current: number, previous: number) {
  const difference = current - previous;
  return difference === 0
    ? "Sin cambio"
    : `${difference > 0 ? "+" : "−"}${Math.abs(difference)} ${Math.abs(difference) === 1 ? "punto" : "puntos"}`;
}
