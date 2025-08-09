import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import InsightsPage from './components/InsightsPage';
import ParkingPage from './components/ParkingPage';

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/parking" element={<ParkingPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </div>
  );
}
