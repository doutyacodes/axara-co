import React from "react";
import ProtectedRoute from "../_components/ProtectedRoute";
import { ChildrenProvider } from "@/context/CreateContext";
import Navbar from "../_components/Navbar";
import SideBar from "../_components/SideBar";
import RightSideBar from "../_components/RightSideBar";
import LayoutWrapper from "../_components/LayoutWrapper";

const ProtectLayout = ({ children }) => {
  return (
    <ProtectedRoute allowedRoutes={["/","/search", "/our-story","/our-features","/about-us","/news","/testing3","/viewpoint"]}>
      <ChildrenProvider>
        <div className="relative min-h-screen flex bg-white">
          <SideBar />

          {/* Content */}
          <LayoutWrapper >
            <Navbar />
            {children}
          </LayoutWrapper>
          <RightSideBar />
        </div>
      </ChildrenProvider>
    </ProtectedRoute>
  );
};

export default ProtectLayout;
