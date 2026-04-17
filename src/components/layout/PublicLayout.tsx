import Nav from "./Nav";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#030809]">
      <Nav />
      <Outlet />
    </div>
  );
}
