import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"

export default function Home() {
  const { count, increment } = useAppStore()

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Open Learn Grid
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Build a modular learning platform.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Vite, React, shadcn/ui, and TanStack Query are wired in. Django powers the
          API with JWT auth and Postgres.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={increment}>Clicks: {count}</Button>
        <Button variant="secondary" asChild>
          <Link to="/about">See the system status</Link>
        </Button>
      </div>
    </section>
  )
}
