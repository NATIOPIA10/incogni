import { BottomNav } from "@/components/ui/BottomNav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
