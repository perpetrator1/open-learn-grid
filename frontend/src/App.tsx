import { NavLink, Route, Routes } from "react-router-dom"

import { cn } from "@/lib/utils"
import About from "@/pages/About"
import Home from "@/pages/Home"
import NotFound from "@/pages/NotFound"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors",
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  )

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="text-sm font-semibold tracking-wide">Open Learn Grid</div>
          <nav className="flex items-center gap-6">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              Status
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
