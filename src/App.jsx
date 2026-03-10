import { useState } from "react";
import Landing from "./Landing.jsx";
import Login from "./Login.jsx";
import Assistant from "./Assistant.jsx";

export default function App() {
  const [page, setPage] = useState("landing"); // landing | login | app

  if (page === "app") return <Assistant onLogout={() => setPage("landing")} />;
  if (page === "login") return <Login onLogin={() => setPage("app")} onBack={() => setPage("landing")} />;
  return <Landing onStart={() => setPage("login")} />;
}
