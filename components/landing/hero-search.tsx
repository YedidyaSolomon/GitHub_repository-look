"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Filters {
  type: string;
  location: string;
  rating: number[];
  price: number[];
}

export default function HeroSearch() {
  const [filters, setFilters] = useState<Filters>({
    type: "",
    location: "",
    rating: [3],
    price: [0, 500],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching with filters:", filters);
    // Route to customer dashboard with filters
    window.location.href =
      "/dashboard/customer?q=" + encodeURIComponent(filters.location);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-5xl mx-auto p-8 bg-card rounded-3xl shadow-2xl border backdrop-blur-sm"
    >
      <Select
        value={filters.type}
        onValueChange={(value) => setFilters({ ...filters, type: value })}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Therapy type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="counseling">Counseling</SelectItem>
          <SelectItem value="psychotherapy">Psychotherapy</SelectItem>
          <SelectItem value="massage">Massage Therapy</SelectItem>
          <SelectItem value="yoga">Yoga & Wellness</SelectItem>
          <SelectItem value="physiotherapy">Physiotherapy</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Enter location (city or zip)"
        value={filters.location}
        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
      />
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Min Rating
        </label>
        <Slider
          value={filters.rating}
          onValueChange={(value) => setFilters({ ...filters, rating: value })}
          max={5}
          step={0.5}
          className="w-full"
        />
        <div className="text-sm font-mono text-muted-foreground">
          {filters.rating[0]}+
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Price Range
        </label>
        <Slider
          value={filters.price}
          onValueChange={(value) => setFilters({ ...filters, price: value })}
          max={1000}
          step={50}
          className="w-full"
        />
        <div className="text-sm font-mono text-muted-foreground">
          ${filters.price[0]} - ${filters.price[1]}
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        className="lg:col-span-1 bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] hover:from-[var(--purple)]/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Search Services
      </Button>
    </form>
  );
}
