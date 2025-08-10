import React from 'react';

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
          <li><a href="/" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Home</a></li>
          <li><a href="/insights" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Insights</a></li>
          <li><a href="/parking" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Parking Map</a></li>
         <li><a href="/spot" className="rounded-full p-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition">Parking Spot</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
