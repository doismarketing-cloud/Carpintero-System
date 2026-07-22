import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser for body
app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La variable de entorno GEMINI_API_KEY no está configurada.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini Custom Cabinet/Furniture Designer Endpoint
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, details } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "El prompt es obligatorio." });
      return;
    }

    const client = getGeminiClient();
    
    const systemInstruction = `Eres un Carpintero Profesional experto en melamina y madera. 
Tu tarea es ayudar al usuario a diseñar un mueble a medida basado en sus requisitos. 
Debes proporcionar especificaciones de diseño detalladas, una lista de materiales precisa y un listado de despiece (cut-list) milimétrico para que el usuario pueda comprar las placas y cantos cortados.
Los grosores de las placas comunes son de 15mm o 18mm. Los cantos pueden ser delgados (0.5mm) o gruesos (2mm).
Responde SIEMPRE estrictamente en formato JSON utilizando el esquema proporcionado. Toda la información debe estar en Español.`;

    const modelPrompt = `Diseña el siguiente mueble: "${prompt}".
Detalles de espacio y preferencias adicionales: ${details || "Ninguno especificado"}.
Por favor, calcula con lógica de carpintería real. Por ejemplo:
- Los laterales van de piso a techo del mueble.
- El techo y piso van encajonados entre los laterales (descontar 2 veces el espesor de la placa a la longitud total del techo/piso).
- Los estantes internos deben ser más cortos que el ancho interior para que quepan holgadamente.
- Las puertas deben tener descuentos de 2 o 3 mm a los lados para las holguras.
Genera la respuesta siguiendo estrictamente el esquema JSON definido.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: modelPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título del proyecto, ej: Mueble de Cocina Modular" },
            summary: { type: Type.STRING, description: "Resumen explicativo del diseño, dimensiones finales, espesor de placa sugerido y por qué se diseñó de esta manera." },
            materials: {
              type: Type.ARRAY,
              description: "Lista de materiales generales como tornillos, bisagras, correderas telescópicas, etc.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nombre del insumo (ej: Bisagras Cangrejo Semicurvas, Tornillos 4x50)" },
                  quantity: { type: Type.STRING, description: "Cantidad sugerida (ej: 4 unidades, 50 piezas, 1 bolsa)" },
                  notes: { type: Type.STRING, description: "Indicaciones o consejos de uso" }
                },
                required: ["name", "quantity"]
              }
            },
            cutList: {
              type: Type.ARRAY,
              description: "Listado detallado de piezas para corte (despiece)",
              items: {
                type: Type.OBJECT,
                properties: {
                  partName: { type: Type.STRING, description: "Nombre de la pieza (ej: Lateral Derecho, Zócalo, Puerta)" },
                  length: { type: Type.NUMBER, description: "Largo de la pieza en milímetros (mm)" },
                  width: { type: Type.NUMBER, description: "Ancho de la pieza en milímetros (mm)" },
                  quantity: { type: Type.INTEGER, description: "Cantidad de piezas con estas dimensiones" },
                  thickness: { type: Type.INTEGER, description: "Espesor de la placa sugerido en mm (ej: 18 o 15)" },
                  edgeBanding: { type: Type.STRING, description: "Detalle de tapacanto en los cuatro lados (ej: Canto grueso en lados largos, canto delgado en un ancho, etc.)" }
                },
                required: ["partName", "length", "width", "quantity", "thickness"]
              }
            },
            assemblySteps: {
              type: Type.ARRAY,
              description: "Pasos secuenciales para armar el mueble correctamente",
              items: { type: Type.STRING }
            }
          },
          required: ["title", "summary", "materials", "cutList", "assemblySteps"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({ error: "El modelo no devolvió ningún contenido." });
      return;
    }

    try {
      const parsedData = JSON.parse(text);
      res.json(parsedData);
    } catch (parseError) {
      console.error("Error al parsear el JSON de Gemini:", text);
      res.status(500).json({ error: "La respuesta de la IA no pudo ser formateada como JSON válido.", raw: text });
    }
  } catch (error: any) {
    console.error("Error en /api/gemini/generate:", error);
    res.status(500).json({ error: error.message || "Error al generar el diseño del mueble." });
  }
});

// Setup Vite Dev Server / Serve static files in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[System Carpintero] Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
