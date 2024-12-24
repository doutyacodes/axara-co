"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl"; // Import the useTranslations hook

function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/tests/");
  const t = useTranslations("Navbar");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUrl = localStorage.getItem("dashboardUrl");
    if (token) {
      setIsLoggedIn(true);
    }
    if (storedUrl) {
      setDashboardUrl(storedUrl);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("dashboardUrl");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  return (
    <div>
      

      {/* Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-75 z-50 transform transition-transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } sm:hidden`}
      >
        <div className="w-64 h-full bg-white p-4">
          <button className="text-black float-right" onClick={toggleSidebar}>
            {t("sidebarCloseButton")}
          </button>
          <div className="mt-8">
            <a href="#" className="block py-2 text-black hover:bg-gray-200">
              {t("aboutUsLink")}
            </a>
            <a
              href="./login"
              className="block py-2 text-black hover:bg-gray-200"
            >
              {t("sidebarLogin")}
            </a>
            <select className="bg-transparent text-black mt-4">
              <option value="">{t("solutionsPlaceholder")}</option>
              <option value="">{t("options.option1")}</option>
              <option value="">{t("options.option2")}</option>
              <option value="">{t("options.option3")}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
