import React from 'react';
import bgPic from "../assets/landingPic.jpg";
import {Link} from 'react-router-dom'

const LandingPage = () => {
    const cards = [
        {
            icon: "🚗",
            title: "Parking Shortage Crisis",
            badge: "High Impact",
            desc:
                "Melbourne CBD has one of the lowest parking space to population ratios in Australia, with only 0.3 spaces per resident."
        },
        {
            icon: "📈",
            title: "Economic Impact",
            badge: "High Impact",
            desc:
                "Drivers spend an average of $2,400 annually on parking fees in Melbourne CBD, with costs increasing 12% year-over-year."
        },
        {
            icon: "⏱️",
            title: "Time Lost Circling",
            badge: "Medium",
            desc:
                "Commuters spend up to 8.5 minutes on average searching for a spot during peak hours."
        },
        {
            icon: "🌿",
            title: "Environmental Cost",
            badge: "Medium",
            desc:
                "Extra idling and circling adds to urban emissions and air pollution in the CBD."
        }
    ];

    const Badge = ({ children }) => (
        <span className="ml-auto inline-flex items-center rounded-full bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5">
            {children}
        </span>
    );

    return (
        <div className="max-w-[1280px] mx-auto">
            <section className="py-8">
                <div className="relative w-full h-[500px]">
                    <img src={bgPic} alt="landing page pic" className="w-full h-full object-cover rounded-2xl" />

                    <div className="absolute inset-0 bg-gradient-to-r from-tealDarkTransparent to-tealLightTransparent" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                        <h1 className="text-3xl md:text-4xl font-bold">ParkingBae Melbourne</h1>
                        <p className="mt-2 text-lg">Smart parking for Melbourne CBD</p>

                        <div className="mt-6 flex gap-4">
                            <Link to="/insights">
                                <button className="bg-white text-[#0097A7] px-6 py-2 rounded-lg font-medium shadow hover:bg-gray-100 transition">
                                    Insights
                                </button>
                            </Link>
                            <Link to="/parking">
                                <button className="bg-white text-[#0097A7] px-6 py-2 rounded-lg font-medium shadow hover:bg-gray-100 transition">
                                    Find Parking
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-6 pb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mt-6">Melbourne Parking Reality</h2>
                <p className="text-center text-gray-600 mt-2">
                    Understanding the challenges facing Melbourne CBD commuters
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((c) => (
                        <div
                            key={c.title}
                            className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-5 hover:shadow-md transition"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-2xl">
                                    {c.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                                {c.badge && <Badge>{c.badge}</Badge>}
                            </div>
                            <p className="mt-3 text-gray-600 leading-relaxed">{c.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
