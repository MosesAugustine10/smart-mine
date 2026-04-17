import { useState, useCallback } from 'react';

export interface GpsLocation {
  latitude: number;
  longitude: number;
}

export function useGpsCapture() {
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturing(true);
    setError(null);
    setCaptured(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLoc);
        setIsCapturing(false);
        setCaptured(true);
      },
      (err) => {
        setError(err.message);
        setIsCapturing(false);
        setCaptured(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return {
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    captureLocation,
    isCapturing,
    error,
    captured
  };
}
