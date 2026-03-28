"use client";

import React from "react";
import { AppLauncherGrid } from "@/components/app-launcher-grid";

export function AppDrawer() {
  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Apps</h1>
        <p className="text-gray-600">Choose an app to get started</p>
      </div>

      <AppLauncherGrid variant="full" />
    </div>
  );
}
