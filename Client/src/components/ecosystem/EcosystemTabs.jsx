import React from "react";
import { Link, useLocation } from "react-router-dom";

const TABS = [
  { to: "/ecosystem", label: "Start a build", match: (p) => p === "/ecosystem" || p.startsWith("/ecosystem/build") },
  { to: "/ecosystem/gallery", label: "Gallery", match: (p) => p.startsWith("/ecosystem/gallery") },
];

const EcosystemTabs = () => {
  const { pathname } = useLocation();
  return (
    <div className="flex gap-2 flex-wrap border-b border-border pb-3.5 mb-7">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4.75 py-2.5 text-[13.5px] font-medium border transition-colors ${
              active ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default EcosystemTabs;
