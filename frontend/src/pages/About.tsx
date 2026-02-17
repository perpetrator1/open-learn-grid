import { useQuery } from "@tanstack/react-query"

export default function About() {
  const { data, isLoading } = useQuery({
    queryKey: ["status"],
    queryFn: async () => "API ready",
  })

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">System status</h2>
      <p className="text-sm text-muted-foreground">
        TanStack Query is configured and ready for API calls.
      </p>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        {isLoading ? "Checking..." : data}
      </div>
    </section>
  )
}
