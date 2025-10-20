'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const libraries: ('places')[] = ['places'];
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.LatLngLiteral | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Only initialize usePlacesAutocomplete when Google Maps is loaded
  const placesAutocomplete = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'in' },
    },
    debounce: 300,
    cache: false,
    initOnMount: isLoaded, // Wait for Google Maps to load
  });

  const {
    ready,
    value: autocompleteValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = placesAutocomplete;

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      const newLocation = { lat, lng };
      setSelectedPlace(newLocation);
      onChange(`Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`);
      if (mapRef.current) {
        mapRef.current.setCenter(newLocation);
      }
      setDialogOpen(true);
    } catch (error) {
      console.error('Error selecting address: ', error);
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (value) {
        const match = value.match(/Lat: (.*), Lon: (.*)/);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            const initialCenter = { lat, lng };
            setSelectedPlace(initialCenter);
            map.setCenter(initialCenter);
            return;
        }
    }
    map.setCenter(defaultCenter);
  }, [value]);

  const handleMapIdle = () => {
    if (mapRef.current) {
      const newCenter = mapRef.current.getCenter()!.toJSON();
      setSelectedPlace(newCenter);
      onChange(`Lat: ${newCenter.lat.toFixed(5)}, Lon: ${newCenter.lng.toFixed(5)}`);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedPlace) {
      onChange(`Lat: ${selectedPlace.lat.toFixed(5)}, Lon: ${selectedPlace.lng.toFixed(5)}`);
    }
    setDialogOpen(false);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setSelectedPlace(newLocation);
          onChange(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
          if (mapRef.current) {
            mapRef.current.setCenter(newLocation);
            mapRef.current.setZoom(15);
          }
        },
        (error) => {
          console.error("Error getting current location: ", error);
          alert("Unable to retrieve your location. Please ensure you have granted permission.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  if (loadError) {
    return <div>Error loading maps. Please check your API key.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Maps...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={autocompleteValue}
          disabled={!ready || !isLoaded}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type an address to search..."
        />
        {status === 'OK' && (
          <div className="absolute z-10 w-full p-2 mt-1 space-y-1 bg-background border rounded-md shadow-lg">
            {data.map(({ place_id, description }) => (
              <div
                key={place_id}
                onClick={() => handleSelect(description)}
                className="p-2 cursor-pointer rounded-md text-foreground hover:bg-[#034948] hover:text-white"
              >
                {description}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            {value ? 'View/Adjust on Map' : 'Or Pick on Map'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pinpoint Incident Location</DialogTitle>
          </DialogHeader>
          <div className="relative h-[500px] w-full">
            <GoogleMap
              mapContainerClassName="h-full w-full"
              zoom={value ? 15 : 5}
              onLoad={onMapLoad}
              onIdle={handleMapIdle}
              center={defaultCenter}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
            </GoogleMap>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
                <MapPin className="h-10 w-10 text-[#ea4335]" />
            </div>
            <div className="absolute top-2 right-2">
                <Button onClick={handleCurrentLocation} variant="outline" size="icon">
                    <LocateFixed className="h-5 w-5" />
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmLocation}>Confirm Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Input
        readOnly
        value={value}
        className="mt-2"
        placeholder="Location coordinates will appear here"
      />
    </div>
  );
}
