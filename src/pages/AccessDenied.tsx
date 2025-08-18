// src/pages/AccessDenied.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don’t have permission to view this page. Please sign in with an account that has the
          required role, or go back to the home page.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/auth"
            className="inline-block rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            Go to Sign In
          </Link>
          <Link
            to="/"
            className="inline-block rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
