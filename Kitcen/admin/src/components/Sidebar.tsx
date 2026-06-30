'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  Pizza, 
  Ticket, 
  Settings, 
  LogOut 
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Live Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Restaurants', href: '/restaurants', icon: Utensils },
  { label: 'Products & Menu', href: '/products', icon: Pizza },
  { label: 'Coupons & Offers', href: '/coupons', icon: Ticket },
  { label: 'App Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 fixed inset-y-0 left-0 glass-panel border-r border-background-border flex flex-col justify-between p-4 z-40">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-black text-lg">
            C
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">
              Clude<span className="text-primary">Kitchen</span>
            </h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Admin Console</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User controls */}
      <div className="pt-4 border-t border-background-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm">
            SA
          </div>
          <div>
            <p className="text-xs font-bold text-white">Super Admin</p>
            <p className="text-[10px] text-gray-500">System Owner</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-primary p-2 rounded-lg transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
