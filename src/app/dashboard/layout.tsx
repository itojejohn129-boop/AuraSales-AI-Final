import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}
