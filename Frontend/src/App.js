import './App.css';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import InsightsPage from './components/InsightsPage';
import Map from './components/Map';
import MelbourneParkingMap from './components/MelbourneParkingMap';

function App() {
  return (
    <div className="App">
      <Navbar/>
      {/* <LandingPage/> */}
      {/* <InsightsPage/> */}
      <Map/>
    </div>
  );
}

export default App;

