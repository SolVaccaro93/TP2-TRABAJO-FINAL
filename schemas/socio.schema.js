import { z } from 'zod';

export const crearSocioSchema = z.object({
  nombre: z.string().trim().min(2).max(50),
  apellido: z.string().trim().min(2).max(50),
  email: z.email().toLowerCase(),
  telefono: z.string().trim().max(20).optional(),
  activo: z.boolean().default(true),
});

// Para PUT/PATCH: todos los campos opcionales, pero al menos uno
export const actualizarSocioSchema = crearSocioSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });
