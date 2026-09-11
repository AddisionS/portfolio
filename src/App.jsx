import React, { useEffect } from "react";

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Skills from "./pages/Skills";
import Contact from "./pages/Contact";

import Navbar from "./components/common/Navbar";

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      "/": "ARYAN // BOOT",
      "/projects": "ARYAN // BUILDS",
      "/skills": "ARYAN // SKILLS",
      "/contact": "ARYAN // CONTACT",
    };

    document.title = titles[location.pathname] || "ARYAN";
  }, [location.pathname]);

  return null;
};

const Layout = () => (
  <>
    <PageTitle />
    <Navbar />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/projects",
        element: <Projects />,
      },
      {
        path: "/skills",
        element: <Skills />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}