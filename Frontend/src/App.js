import './App.css';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import InsightsPage from './components/InsightsPage';
import Map from './components/ParkingMap';
import ParkingMap from './components/ParkingMap';

function App() {
  return (
    <div className="App">
      <Navbar/>
      {/* <LandingPage/> */}
      {/* <InsightsPage/> */}
      <ParkingMap/>
    </div>
  );
}

export default App;

