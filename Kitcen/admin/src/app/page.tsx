'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const chartData = [
  { name: 'Jan', revenue: 4000, orders: 240 },
  { name: 'Feb', revenue: 3000, orders: 198 },
  { name: 'Mar', revenue: 5000, orders: 310 },
  { name: 'Apr', revenue: 2780, orders: 180 },
  { name: 'May', revenue: 1890, orders: 120 },
  { name: 'Jun', revenue: 6390, orders: 420 },
  { name: 'Jul', revenue: 8490, orders: 590 },
];

const mockOrders = [
  { id: 'CK-8931', customer: 'Arjun Mehta', restaurant: 'The Pizza Box', total: '₹540.00', status: 'preparing', time: '5 mins ago' },
  { id: 'CK-8932', customer: 'Sneha Rao', restaurant: 'Burger Bistro', total: '₹320.00', status: 'ready', time: '12 mins ago' },
  { id: 'CK-8933', customer: 'David Miller', restaurant: 'Spice Symphony', total: '₹1,240.00', status: 'on_the_way', time: '18 mins ago' },
  { id: 'CK-8934', customer: 'Priya Patel', restaurant: 'Sushi Roll', total: '₹890.00', status: 'delivered', time: '45 mins ago' },
  { id: 'CK-8935', customer: 'Kabir Singh', restaurant: 'Wok & Roll', total: '₹410.00', status: 'cancelled', time: '1 hr ago' },
];

const statusStyles: Record<string, string> = {
  preparing: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  ready: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  on_the_way: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-500 border border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border border-red-500/20',
};

const statusLabels: Record<string, string> = {
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'orders'>('revenue');

  return (
    <div className="flex-1 flex flex-col bg-black text-white min-h-screen">
      <Header title="Analytics & Dashboard" />

      <div className="p-8 space-y-8 flex-1">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold tracking-tight">₹4,89,320</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp size={12} /> +12.4% <span className="text-gray-500 font-normal">from last month</span>
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Orders</span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold tracking-tight">42</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1 font-semibold">
                <Clock size={12} /> Live tracking <span className="text-gray-500 font-normal">currently active</span>
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Partners</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold tracking-tight">186</h3>
              <p className="text-xs text-blue-400 mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle size={12} /> 124 Online <span className="text-gray-500 font-normal">on shift</span>
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Customer Rating</span>
              <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold tracking-tight">4.82</h3>
              <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1 font-semibold">
                ★ 94% positive <span className="text-gray-500 font-normal">reviews this week</span>
              </p>
            </div>
          </div>
        </div>

        {/* Charts & Interactive area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white">Performance Overview</h4>
                <p className="text-xs text-gray-500">Financial growth track for current fiscal period</p>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl border border-background-border">
                <button 
                  onClick={() => setActiveTab('revenue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'revenue' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Revenue
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'orders' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Volume
                </button>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'revenue' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Bar dataKey="orders" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats sidebar */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white">Live Operations</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-xs text-gray-300 font-semibold">Kitchen Cooking</span>
                  </div>
                  <span className="text-sm font-bold">14 orders</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs text-gray-300 font-semibold">Awaiting Courier</span>
                  </div>
                  <span className="text-sm font-bold">8 orders</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs text-gray-300 font-semibold">Out for Delivery</span>
                  </div>
                  <span className="text-sm font-bold">20 orders</span>
                </div>
              </div>
            </div>

            <div className="border-t border-background-border pt-4 mt-4">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-all border border-white/5 hover:border-primary/30">
                View Dispatch Map <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Orders table */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white">Incoming Live Orders</h4>
              <p className="text-xs text-gray-500">Real-time status updates and order validation queue</p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">View All Orders</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-background-border text-xs text-gray-500 font-semibold">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Restaurant</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-border text-xs text-gray-300">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3.5 font-bold text-white">{order.id}</td>
                    <td className="py-3.5 font-semibold">{order.customer}</td>
                    <td className="py-3.5 text-gray-400">{order.restaurant}</td>
                    <td className="py-3.5 font-bold text-white">{order.total}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusStyles[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-500">{order.time}</td>
                    <td className="py-3.5 text-right">
                      <button className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-black font-extrabold transition-all">
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
