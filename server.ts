import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for categorization
  app.post("/api/categorize-transaction", async (req, res) => {
    try {
      const { note, amount, type, existingCategories } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is missing" });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Kategorikan transaksi dengan detail berikut:
Catatan: "${note}"
Nominal: ${amount ? amount : 'Tidak ditentukan'}
Tipe: ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
Kategori yang tersedia: ${existingCategories.join(", ")}

Pilih satu kategori yang paling cocok dari daftar di atas. Jika tidak ada yang sangat cocok, sarankan nama kategori baru yang singkat (1-2 kata).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedCategory: {
                type: Type.STRING,
                description: "Kategori yang direkomendasikan",
              },
              isNew: {
                type: Type.BOOLEAN,
                description: "True jika ini adalah kategori baru yang tidak ada dalam daftar yang diberikan",
              }
            },
            required: ["recommendedCategory", "isNew"],
          }
        }
      });
      
      if (!response.text) throw new Error("No response text");
      const result = JSON.parse(response.text.trim());
      
      res.json(result);
    } catch (error) {
      console.error("AI Error Categorizing:", error);
      res.status(500).json({ error: "Failed to categorize transaction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
