import React, { useEffect } from "react";
import OrdersTab from "../components/dashboard/OrdersTab";

export default function MyOrders() {
  useEffect(() => {
    document.title = "My Orders | PetCenter";
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
      <OrdersTab />
    </div>
  );
}
