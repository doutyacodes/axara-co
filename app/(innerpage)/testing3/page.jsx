'use client';

import { useState, useEffect } from 'react';

const useUserRegion = () => {
  const [region, setRegion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use a reverse geocoding API to get region
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          setRegion(data.address.country); // Set the country/region
        },
        (err) => {
          console.error(err);
          setError('Location access denied');
        }
      );
    } else {
      setError('Geolocation not supported');
    }
  }, []);

  return { region, error };
};

export default function Home() {
  const { region, error } = useUserRegion();

  return (
    <div>
      <h1>User Region Detection</h1>
      {region ? <p>Your region: {region}</p> : <p>{error || 'Detecting region...'}</p>}
    </div>
  );
}
