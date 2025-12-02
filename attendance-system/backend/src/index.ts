import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import attendanceRouter from "./routes/attendance";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base route
app.get("/", (_req, res) => {
  res.send("Attendance backend is running");
});

// Attendance routes (similar to /api/attendance/* in Next.js)
app.use("/attendance", attendanceRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
