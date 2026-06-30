import React from 'react';
import Sidebar from '../components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'Clude Kitchen - Admin Panel',
  description: 'Premium administrative workspace for Clude Kitchen Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-white antialiased overflow-x-hidden">
        <div className="flex min-h-screen">
          {/* Static Sidebar */}
          <Sidebar />

          {/* Main workspace content area */}
          <div className="flex-1 pl-64 flex flex-col min-h-screen bg-black">
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
