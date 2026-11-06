import { z } from 'zod';

// Solo forma de los datos. Que el socio y la clase existan es regla de negocio: va en el caso de uso
export const crearInscripcionSchema = z.object({
  socioId: z.number().int().positive(),
  claseId: z.number().int().positive(),
});