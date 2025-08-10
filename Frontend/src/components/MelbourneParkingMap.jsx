import React from 'react';

const MelbourneParkingMap = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center', // Centers children horizontally
      alignItems: 'center',     // Centers children vertically
      height: '100vh',          // Makes the container take up the full viewport height
      flexDirection: 'column'   // Stacks children vertically
    }}>
      <h1>Melbourne Parking Data</h1>
      <iframe 
        src="https://data.melbourne.vic.gov.au/explore/embed/dataset/on-street-parking-bay-sensors/custom/?dataChart=eyJxdWVyaWVzIjpbeyJjaGFydHMiOlt7InR5cGUiOiJjb2x1bW4iLCJmdW5jIjoiQ09VTlQiLCJ5QXhpcyI6ImJheV9pZCIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiNFNTBFNTYifV0sInhBeGlzIjoibGFzdHVwZGF0ZWQiLCJtYXhwb2ludHMiOjUwLCJzb3J0IjoiIiwidGltZXNjYWxlIjoiZGF5IiwiY29uZmlnIjp7ImRhdGFzZXQiOiJvbi1zdHJlZXQtcGFya2luZy1iYXktc2Vuc29ycyIsIm9wdGlvbnMiOnt9fX1dLCJ0aW1lc2NhbGUiOiIiLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlfQ%3D%3D&static=false&datasetcard=false"
        width="800"
        height="600"
        frameBorder="0"
        title="Melbourne On-Street Parking Data"
      ></iframe>
    </div>
  );
};

export default MelbourneParkingMap;