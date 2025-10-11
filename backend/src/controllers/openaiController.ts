import { Request, Response, NextFunction } from "express";
import { obtenerRespuestaChat } from "../services/openaiService.js";

export const generarRespuesta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { promptBase, mensajeUsuario, modelo, } = req.body;
    const respuesta = await obtenerRespuestaChat({ promptBase, mensajeUsuario, modelo });
    res.json({ respuesta });
  } catch (error) {
    next(error);
  }
};
