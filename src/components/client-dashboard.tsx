"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CatalystDashboard from "@/components/catalyst-dashboard";

interface ClientDashboardProps {
  user: any;
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Map pathname to tab
  const getTabFromPath = (path: string): string => {
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];
    
    switch (lastSegment) {
      case 'dashboard':
        return 'timetable';
      case 'students':
        return 'students';
      case 'teachers':
        return 'teachers';
      case 'courses':
        return 'courses';
      case 'programs':
        return 'programs';
      case 'sections':
        return 'sections';
      case 'rooms':
        return 'rooms';
      case 'departments':
        return 'departments';
      case 'labs':
        return 'labs';
      case 'requests':
        return 'requests';
      case 'user-management':
        return 'passwords';
      default:
        return 'timetable';
    }
  };

  const currentTab = getTabFromPath(pathname);

  // Add a brief loading state during navigation
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-75' : 'opacity-100'}`}>
      <CatalystDashboard user={user} initialTab={currentTab} />
    </div>
  );
}