import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 font-sans select-none overflow-hidden relative">
      {/* Left Column: Auth Card */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 relative z-10 min-h-screen">
        {/* Subtle green ambient glow blobs on the left */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#86BC25]/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md mx-auto relative z-20">
          {children}
        </div>
      </div>

      {/* Right Column: Graphic Section */}
      <div className="hidden lg:block lg:col-span-7 relative min-h-screen w-full overflow-hidden bg-slate-950">
        {/* Left-to-right fade gradient for smooth blending with the dark left side */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        {/* Overall ambient overlay */}
        <div className="absolute inset-0 bg-slate-950/20 z-10 pointer-events-none" />
        <img
          src="/laptopdata.jpg"
          alt="DataTalk Analytics Dashboard"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      </div>
    </div>
  );
}

