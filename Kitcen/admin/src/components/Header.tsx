'use client';

import React from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';

export default function Header({ title = 'Dashboard' }) {
  return (
    <header className="h-16 border-b border-background-border glass-panel flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search orders, clients..."
            className="w-full bg-white/5 border border-background-border rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-gray-500" />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <Bell size={16} />
          </button>
          <button className="text-gray-400 hover:text-primary p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <Moon size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
