import { z } from 'zod';

const claseBase = z.object({
  nombre: z.string().trim().min(2).max(100),
  descripcion: z.string().trim().max(500).optional(),
  cupoMaximo: z.number().int().positive(),
});

export const crearClaseSchema = claseBase;

export const actualizarClaseSchema = claseBase
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });
