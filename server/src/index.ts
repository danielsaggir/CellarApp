import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import authRoutes from "./routes/auth";
import wineRoutes from "./routes/wines";
import aiRoutes from "./routes/ai";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Wine Cellar — API OK 🍷" });
});

app.use("/auth", authRoutes);
app.use("/wines", wineRoutes);
app.use(aiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
