import React, { useEffect } from "react";
import FavoritesTab from "../components/dashboard/FavoritesTab";

export default function SavedItems() {
  useEffect(() => {
    document.title = "Saved Pets & Products | PetCenter";
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
      <FavoritesTab />
    </div>
  );
}
