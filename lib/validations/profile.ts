import { z } from "zod";
const optionalDate = z
  .string()
  .refine(
    (value) =>
      !value ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value &&
        value <= new Date().toISOString().slice(0, 10)),
    "Fecha de nacimiento inválida.",
  );
export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre.")
    .max(100, "Máximo 100 caracteres."),
  avatar_url: z
    .string()
    .max(2048)
    .refine(
      (value) =>
        !value ||
        (/^https:\/\//.test(value) &&
          z.string().url().safeParse(value).success),
      "Avatar inválido.",
    ),
  birth_date: optionalDate,
  birth_time: z
    .string()
    .refine(
      (value) => !value || /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value),
      "Hora inválida.",
    ),
  birth_city: z.string().trim().max(150, "Máximo 150 caracteres."),
  bio: z
    .string()
    .trim()
    .max(500, "Tu presentación no puede superar 500 caracteres.")
    .optional(),
});
