"use client";
import { Button } from "@/components/ui/button";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";

const mockProviders = [
  {
    position: [6.5244, 3.3792],
    name: "Lagos Wellness Center",
    rating: 4.8,
    distance: "1.2 km",
  },
  {
    position: [6.5313, 3.3855],
    name: "Victoria Therapy Hub",
    rating: 4.9,
    distance: "0.8 km",
  },
  {
    position: [6.5177, 3.3907],
    name: "Island Physiotherapy",
    rating: 4.7,
    distance: "2.1 km",
  },
];

export default function MapSection() {
  const defaultCenter = [6.5244, 3.3792]; // Lagos center

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] bg-clip-text text-transparent mb-6">
            Therapy Services Near You
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover verified therapy centers and wellness providers in your
            area. Real-time availability and ratings.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <div>
            <Card className="backdrop-blur-sm bg-card/90 border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MapPin className="w-8 h-8 text-[var(--purple)]" />
                  Nearby Providers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {mockProviders.map((provider, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-3 h-3 bg-[var(--purple)] rounded-full group-hover:animate-ping" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{provider.name}</h3>
                        <div className="flex items-center gap-1 text-sm">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground"}`}
                            />
                          ))}
                          <span>({provider.rating})</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider.distance} away • Open now
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8">
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl border">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: "400px", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              />
              {mockProviders.map((provider, index) => (
                <Marker key={index} position={provider.position}>
                  <Popup>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      4.8 • {provider.distance}
                    </div>
                    <Button size="sm" className="w-full">
                      Book Now
                    </Button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
