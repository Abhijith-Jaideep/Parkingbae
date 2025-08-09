import React from 'react';
import bgPic from "../assets/landingPic.jpg";

const LandingPage = () => {
    return (
        <div className="flex justify-center py-8">
            <div className="relative w-[1280px] h-[500px]">
                <img src={bgPic} alt="landing page pic" className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-tealDarkTransparent to-tealLightTransparent bg-opacity-50"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                    <h1 className="text-3xl md:text-4xl font-bold">ParkingBae Melbourne</h1>
                    <p className="mt-2 text-lg">Smart parking for Melbourne CBD</p>

                    <div className="mt-6 flex gap-4">
                        <button className="bg-white text-[#0097A7] px-6 py-2 rounded-lg font-medium shadow hover:bg-gray-100 transition">
                            Insights
                        </button>
                        <button className="bg-white text-[#0097A7] px-6 py-2 rounded-lg font-medium shadow hover:bg-gray-100 transition">
                            Find Parking
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
