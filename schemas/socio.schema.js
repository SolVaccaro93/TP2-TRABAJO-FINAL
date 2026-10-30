import { z } from 'zod';

// Campos base sin defaults, para que .partial() no invente valores en el update
const socioBase = z.object({
  nombre: z.string().trim().min(2).max(50),
  apellido: z.string().trim().min(2).max(50),
  // Normaliza antes de validar: z.email() rechaza espacios alrededor
  email: z.string().trim().toLowerCase().pipe(z.email()),
  telefono: z.string().trim().max(20).optional(),
  activo: z.boolean(),
});

export const crearSocioSchema = socioBase.extend({
  activo: socioBase.shape.activo.default(true),
});

// Para PUT/PATCH: todos los campos opcionales, pero al menos uno
export const actualizarSocioSchema = socioBase
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });
