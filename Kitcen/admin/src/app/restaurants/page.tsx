'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import { Utensils, Star, MapPin, ToggleLeft, ToggleRight, Plus, Search } from 'lucide-react';

const mockRestaurants = [
  { id: '1', name: 'The Pizza Box', owner: 'Arjun Mehta', cuisine: 'Italian, Pizza', rating: 4.8, status: 'Open', locations: 'Andheri West', items: 34 },
  { id: '2', name: 'Burger Bistro', owner: 'Sneha Rao', cuisine: 'Fast Food, American', rating: 4.5, status: 'Open', locations: 'Bandra East', items: 21 },
  { id: '3', name: 'Spice Symphony', owner: 'Ramesh Kumar', cuisine: 'North Indian, Mughlai', rating: 4.7, status: 'Closed', locations: 'Juhu', items: 56 },
  { id: '4', name: 'Sushi Roll', owner: 'David Miller', cuisine: 'Japanese, Asian', rating: 4.9, status: 'Open', locations: 'Colaba', items: 42 },
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStatus = (id: string) => {
    setRestaurants(prev => prev.map(rest => {
      if (rest.id === id) {
        return {
          ...rest,
          status: rest.status === 'Open' ? 'Closed' : 'Open'
        };
      }
      return rest;
    }));
  };

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-black text-white min-h-screen">
      <Header title="Restaurant Management" />

      <div className="p-8 space-y-6 flex-1">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by outlet name, food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-background-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
          </div>

          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/10">
            <Plus size={14} /> Add New Restaurant
          </button>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((restaurant) => (
            <div key={restaurant.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Utensils size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{restaurant.name}</h4>
                      <p className="text-xs text-gray-500">{restaurant.cuisine}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    restaurant.status === 'Open' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {restaurant.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-background-border py-4 my-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Owner Contact</span>
                    <span className="text-white font-semibold">{restaurant.owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Total Catalog Items</span>
                    <span className="text-white font-semibold">{restaurant.items} Products</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Rating Score</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <Star size={12} className="fill-yellow-500 text-yellow-500" /> {restaurant.rating}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Operating Zone</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> {restaurant.locations}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <span className="text-[11px] text-gray-400 font-semibold">Active Operating Status</span>
                <button 
                  onClick={() => toggleStatus(restaurant.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {restaurant.status === 'Open' ? (
                    <ToggleRight size={32} className="text-primary" />
                  ) : (
                    <ToggleLeft size={32} className="text-zinc-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
