import React from 'react';
import bgPic from "../assets/landingPic.jpg";
import { Link } from 'react-router-dom'
import { FaCar, FaClock, FaChartLine, FaUsers } from "react-icons/fa";

const LandingPage = () => {


    const stats = [
        {
            icon: <FaCar className="text-xl text-tealLight" />,
            value: "30%",
            label: "CBD Traffic from Parking Search",
            source: "https://www.abc.net.au/news/2023-03-11/melbourne-cbd-parking-overhaul-traffic-signage-ease-congestion/102083888"
        },
        {
            icon: <FaChartLine className="text-xl text-tealLight" />,
            value: "34–35%",
            label: "Typical Congestion (2024)",
            source: "https://www.tomtom.com/traffic-index/melbourne-traffic/"
        },
        {
            icon: <FaClock className="text-xl text-tealLight" />,
            value: "60–70%",
            label: "Rush Hour Congestion",
            source: "https://www.tomtom.com/traffic-index/melbourne-traffic/"
        },
        {
            icon: <FaUsers className="text-xl text-tealLight" />,
            value: "Feb 14, 2024",
            label: "Worst Travel Day",
            source: "https://www.tomtom.com/traffic-index/melbourne-traffic/"
        },
    ];


    const cards = [
        {
            icon: "🚗",
            title: "Parking Shortage Crisis",
            badge: "High Impact",
            desc: "Melbourne CBD has one of the lowest parking space to population ratios in Australia, with only 0.3 spaces per resident.",
            source: "https://www.melbourne.vic.gov.au/off-street-parking"
        },
        {
            icon: "📈",
            title: "Economic Impact",
            badge: "High Impact",
            desc: "Drivers spend an average of $2,400 annually on parking fees in Melbourne CBD, with costs increasing 12% year-over-year.",
            source: "https://www.couriermail.com.au/real-estate/national/park-that-what-would-you-pay-to-park-your-car-in-australia/news-story/833925e71bc7726836f73fc10b642422"
        },
        {
            icon: "🌿",
            title: "Environmental Cost",
            badge: "Medium",
            desc: "Extra idling and circling adds to urban emissions and air pollution in the CBD.",
            source: "https://eponline.com/articles/2022/10/19/engine-idling.aspx"
        },
        {
            icon: "🅿️",
            title: "Peak Hour Space Availability",
            badge: "High Impact",
            desc: "On-street parking occupancy in Melbourne CBD reaches up to 90% during peak hours.",
            source: "https://drivemate.au/blog/affordable-parking-in-melbourne-cbd-the-ultimate-guide-by-drive-mate-clws5w62l003dr5g3oehirmia/"
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

            <section className="w-full flex justify-center py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1280px] w-full">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-gray-100 rounded-xl shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition"
                        >
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-teal-50 mb-4">
                                {stat.icon}
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
                            {stat.source && (
                                <a
                                    href={stat.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 text-xs text-teal-600 underline hover:text-teal-800"
                                >
                                    Source
                                </a>
                            )}
                        </div>
                    ))}
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
                            {c.source && (
                                <a
                                    href={c.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 block text-xs text-teal-600 underline hover:text-teal-800"
                                >
                                    Source
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
