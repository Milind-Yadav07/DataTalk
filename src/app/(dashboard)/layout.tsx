import AppSidebar from '../../components/layout/AppSidebar';
import TopBar from '../../components/layout/TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Fixed Sidebar */}
      <AppSidebar />

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col h-full">
        {/* Top Header Bar */}
        <TopBar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
