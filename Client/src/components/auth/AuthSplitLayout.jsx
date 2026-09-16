import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

// Shared two-panel shell for Login/Register: a colored visual+copy panel on
// the left, and the page's own form content on the right.
const AuthSplitLayout = ({ panelBg, panelImage, panelVideo, heading, description, maxWidthClass = "max-w-255", children }) => (
  <div className="min-h-[calc(100vh-1px)] bg-border flex items-center justify-center px-7 py-12">
    <div className={`w-full ${maxWidthClass} bg-light border border-[#dcd4c6] rounded-[30px] overflow-hidden grid grid-cols-1 lg:grid-cols-[0.88fr_1fr] shadow-2xl shadow-black/20`}>
      <div className="relative lg:min-h-135 flex flex-col justify-between gap-10 p-10" style={{ background: panelBg }}>
        {panelVideo ? (
          <>
            {/* No loop, per the source clip — it plays through once and holds its last frame. */}
            <video src={panelVideo} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(170deg, ${panelBg}e0, #292925a0 60%, #29292529)` }}
            />
          </>
        ) : panelImage ? (
          <>
            <img src={panelImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(170deg, ${panelBg}e0, #292925a0 60%, #29292529)` }}
            />
          </>
        ) : null}
        <Link to="/" className="relative flex items-center gap-2.5 w-max">
          <span className="w-9 h-9 rounded-full bg-light flex items-center justify-center p-1.5 shrink-0">
            <img src={logo} alt="" className="w-full h-full object-contain" />
          </span>
          <span className="font-heading text-xl font-semibold text-light">PetCenter</span>
        </Link>
        <div className="relative">
          <h2 className="font-heading text-[36px] font-medium leading-[1.14] text-white mb-3.5 tracking-tight">{heading}</h2>
          <p className="text-[15px] leading-relaxed text-border max-w-75">{description}</p>
        </div>
      </div>

      <div className="px-8 sm:px-13 py-11 flex flex-col justify-center">{children}</div>
    </div>
  </div>
);

export default AuthSplitLayout;
