// src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">404 — Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you’re looking for doesn’t exist.
        </p>
        <Link
          to="/"
          className="inline-block rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
