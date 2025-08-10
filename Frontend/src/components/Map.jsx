import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../index.css'; // Corrected path to index.css

function ParkingMap() {
  const [searchInput, setSearchInput] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('');
  
  // Use a ref to hold the map instance to prevent re-initialization
  const mapRef = useRef(null);
  
  // Example parking data
  const parkingSpots = [
    { name: 'Flinders Street', coords: [-37.8183, 144.9671], status: 'Available', day: 'Mon', time: '10:00' },
    { name: 'Collins Street', coords: [-37.8155, 144.9662], status: 'Limited', day: 'Tue', time: '14:00' },
    { name: 'Bourke Street Mall', coords: [-37.8140, 144.9633], status: 'Full', day: 'Wed', time: '09:00' },
    { name: 'Federation Square', coords: [-37.8179, 144.9691], status: 'Limited', day: 'Thu', time: '16:00' },
    { name: 'Queen Victoria Market', coords: [-37.8076, 144.9568], status: 'Available', day: 'Fri', time: '11:00' },
    { name: 'Southern Cross Station', coords: [-37.8180, 144.9525], status: 'Limited', day: 'Sat', time: '13:00' },
    { name: 'Parliament House', coords: [-37.8114, 144.9730], status: 'Available', day: 'Sun', time: '15:00' },
    { name: 'State Library', coords: [-37.8099, 144.9656], status: 'Full', day: 'Mon', time: '17:00' },
  ];

  const statusColors = {
    'Available': 'green',
    'Limited': 'orange',
    'Full': 'red'
  };

  useEffect(() => {
    // Initialize the map only once
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([-37.8136, 144.9631], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
    
    // Clear existing markers before adding new ones
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Filter and add new markers
    const filteredSpots = parkingSpots.filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchInput.toLowerCase());
      const matchesDay = (dayFilter === 'all' || spot.day === dayFilter);
      const matchesTime = (!timeFilter || spot.time === timeFilter);
      return matchesSearch && matchesDay && matchesTime;
    });

    filteredSpots.forEach(spot => {
      const marker = L.circleMarker(spot.coords, {
        radius: 8,
        fillColor: statusColors[spot.status] || 'gray',
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapRef.current);

      marker.bindPopup(
        `<b>${spot.name}</b><br>Status: ${spot.status}<br>Day: ${spot.day}<br>Time: ${spot.time}`
      );
    });

    // Clean up function to remove map on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [searchInput, dayFilter, timeFilter]); // Dependencies for useEffect

  return (
    <div className="map-container">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl p-6 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Melbourne CBD Live Map</h1>
              <p className="text-sm text-gray-500">Real-time mock data with parking availability</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full">
            <input
              type="text"
              id="search-input"
              placeholder="Search a street, zone, or landmark..."
              className="filter-input pl-10 pr-4"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex w-full md:w-auto space-x-2 md:space-x-4">
            <select
              id="day-filter"
              className="filter-input cursor-pointer min-w-[120px] md:w-1/2"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
            >
              <option value="all">All Days</option>
              <option value="Mon">Monday</option>
              <option value="Tue">Tuesday</option>
              <option value="Wed">Wednesday</option>
              <option value="Thu">Thursday</option>
              <option value="Fri">Friday</option>
              <option value="Sat">Saturday</option>
              <option value="Sun">Sunday</option>
            </select>
            <input
              type="time"
              id="time-filter"
              className="filter-input cursor-pointer min-w-[120px] md:w-1/2"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-grow min-h-[400px]">
          <div id="map" className="w-full h-full"></div>

          {/* Legend */}
          <div className="absolute top-4 right-4 p-3 bg-white rounded-xl shadow-md text-sm text-gray-800 z-[1000]">
            <div className="flex items-center space-x-2">
              <div className="flex items-center"><span className="h-4 w-4 rounded-full bg-green-500 mr-2"></span>Available</div>
              <div className="flex items-center"><span className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></span>Limited</div>
              <div className="flex items-center"><span className="h-4 w-4 rounded-full bg-red-500 mr-2"></span>Full</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParkingMap;