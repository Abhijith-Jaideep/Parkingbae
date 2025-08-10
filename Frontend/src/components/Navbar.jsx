import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <Link to="/" className="block">
          <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-tealDark to-tealLight bg-clip-text text-transparent">
            ParkingBae
          </h1>
          <p className="hidden sm:block text-sm text-gray-600">
            Smart parking for Melbourne CBD
          </p>
        </Link>

        <ul className="hidden md:flex items-center gap-6 text-sm md:text-base">
          <li>
            <Link
              to="/"
              className="rounded-full px-3 py-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/insights"
              className="rounded-full px-3 py-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition"
            >
              Insights
            </Link>
          </li>
          <li>
            <Link
              to="/parking"
              className="rounded-full px-3 py-2 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight transition"
            >
              Parking Map
            </Link>
          </li>
        </ul>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 ring-1 ring-gray-300 text-gray-700"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          {!open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${open ? "max-h-96" : "max-h-0"}`}
      >
        <ul className="px-4 pb-4 space-y-2 border-t bg-white">
          <li>
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-3 py-3 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/insights"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-3 py-3 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight"
            >
              Insights
            </Link>
          </li>
          <li>
            <Link
              to="/parking"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-3 py-3 hover:text-white hover:bg-gradient-to-r from-tealDark to-tealLight"
            >
              Parking Map
            </Link>
          </li>
        </ul>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[-1]"
          onClick={() => setOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
