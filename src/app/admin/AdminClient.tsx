'use client';

import dynamicModule from 'next/dynamic';
import React from 'react';
import { useRouter } from 'next/navigation';

const AdminDashboard = dynamicModule(
  () => import('@/ui/AdminDashboard').then((mod) => mod.AdminDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white z-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-emerald-400">Loading Arcade Admin Command...</p>
      </div>
    )
  }
);

export default function AdminClient() {
  const router = useRouter();

  return (
    <AdminDashboard
      onBackToHub={() => {
        router.push('/dashboard');
      }}
    />
  );
}
