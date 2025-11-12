// 🔧 Wrapper para controladores async
import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para manejar controladores async en Express
 * Convierte Promise<Response> a Promise<void> para compatibilidad con tipos
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
