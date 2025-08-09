import React from 'react';
import { Link } from 'react-router-dom';


const Navbar = () => {
  return (
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl p-1 md:text-3xl font-semibold bg-gradient-to-r from-tealDark to-tealLight bg-clip-text text-transparent">
            ParkingBae
          </h1>
          <p className="text-sm text-gray-600">
            Smart parking for Melbourne CBD
          </p>
        </div>

        <ul className="flex items-center gap-6 text-sm md:text-base">
          <Link to="/" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Home</Link>
          <Link to="/insights" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Insights</Link>
          <Link to="/parking" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Parking Map</Link>

        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
