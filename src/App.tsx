import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import UploadPage from "@/pages/UploadPage";
import TrainPage from "@/pages/TrainPage";
import PredictPage from "@/pages/PredictPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/train" element={<TrainPage />} />
            <Route path="/predict" element={<PredictPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
