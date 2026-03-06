import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import Dashboard from "./pages/Dashboard";
import PlayerProfile from "./pages/PlayerProfile";
import Awards from "./pages/Awards";
import Tagger from "./pages/Tagger";
import Login from "./pages/Login";
import Changelog from "./pages/ChangeLog";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages with nav */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/changelog" element={<Changelog />} />
        </Route>

        {/* Standalone pages without nav */}
        <Route path="/login" element={<Login />} />
        <Route path="/tag" element={<Tagger />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
