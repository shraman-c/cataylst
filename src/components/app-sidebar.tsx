'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CatalystIcon } from '@/components/icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Database,
  FileText,
  GraduationCap,
  Home,
  School,
  Settings,
  Users,
  Clock,
  BookOpen,
  User,
  UserPlus,
  Menu,
  Building2,
  KeyRound,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Zap,
  UserCheck,
  Layout,
  FolderOpen,
  Shield,
  LayoutDashboard,
  FileEdit,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type View = "admin" | "teacher" | "student"

interface DashboardUser {
  userId: string;
  name: string;
  role: string;
}

interface AppSidebarProps {
  user: DashboardUser
  view: View
  setView: (view: View) => void
  selectedUserId: string | null
  setSelectedUserId: (userId: string | null) => void
  teachers: any[]
  students: any[]
  changeRequests: any[]
  dbStatus: 'checking' | 'success' | 'error'
  onGenerateTimetable: () => void
  onRegisterUser: () => void
  isGenerating: boolean
  isLoadingData: boolean
  currentTab: string
  setCurrentTab: (tab: string) => void
}

const navigationGroups = {
  admin: [
    {
      title: "Overview",
      icon: Layout,
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          tab: "timetable",
          url: "/dashboard",
          description: "Main overview & timetables"
        },
        {
          title: "Change Requests", 
          icon: FileEdit,
          tab: "requests",
          url: "/dashboard/requests",
          description: "Review & approve changes",
          badge: "changeRequests"
        },
      ]
    },
    {
      title: "Academic Management",
      icon: GraduationCap,
      items: [
        {
          title: "Students",
          icon: GraduationCap,
          tab: "students",
          url: "/dashboard/students",
          description: "Manage student records"
        },
        {
          title: "Teachers",
          icon: UserCheck,
          tab: "teachers",
          url: "/dashboard/teachers",
          description: "Faculty & staff management"
        },
        {
          title: "Courses",
          icon: BookOpen,
          tab: "courses",
          url: "/dashboard/courses",
          description: "Manage course catalog"
        },
        {
          title: "Programs",
          icon: Database,
          tab: "programs",
          url: "/dashboard/programs",
          description: "Academic programs & curricula"
        },
        {
          title: "Sections",
          icon: Users,
          tab: "sections",
          url: "/dashboard/sections",
          description: "Student section management"
        },
      ]
    },
    {
      title: "Infrastructure",
      icon: Building2,
      items: [
        {
          title: "Rooms",
          icon: School,
          tab: "rooms",
          url: "/dashboard/rooms",
          description: "Classroom & facility mgmt"
        },
        {
          title: "Departments",
          icon: Building2,
          tab: "departments",
          url: "/dashboard/departments",
          description: "Academic departments"
        },
        {
          title: "Labs",
          icon: FlaskConical,
          tab: "labs",
          url: "/dashboard/labs",
          description: "Laboratory facilities"
        },
      ]
    },
    {
      title: "Administration",
      icon: Shield,
      items: [
        {
          title: "User Management",
          icon: KeyRound,
          tab: "passwords",
          url: "/dashboard/user-management",
          description: "Generate/reset passwords"
        },
      ]
    },
  ],
  teacher: [
    {
      title: "My Teaching",
      icon: User,
      items: [
        {
          title: "My Schedule",
          icon: Calendar,
          tab: "timetable",
          url: "/dashboard",
          description: "View your teaching schedule"
        },
      ]
    },
  ],
  student: [
    {
      title: "My Studies",
      icon: GraduationCap,
      items: [
        {
          title: "My Timetable",
          icon: Calendar,
          tab: "timetable",
          url: "/dashboard",
          description: "View your class schedule"
        },
      ]
    },
  ]
}

// NavigationGroup component for collapsible sections
function NavigationGroup({
  group,
  pendingRequests,
  onItemClick
}: {
  group: any,
  pendingRequests: number,
  onItemClick: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(true)
  const pathname = usePathname()
  const hasActiveItem = group.items.some((item: any) => pathname === item.url)
  
  // Keep groups with active items open
  React.useEffect(() => {
    if (hasActiveItem) {
      setIsOpen(true)
    }
  }, [hasActiveItem])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between h-auto p-2 transition-all duration-200 rounded-lg group mb-1",
            "hover:bg-primary/5 hover:text-primary text-foreground border border-transparent hover:border-primary/20",
            hasActiveItem && "bg-primary/10 text-primary border-primary/30"
          )}
        >
          <div className="flex items-center gap-2">
            <group.icon className={cn(
              "h-4 w-4 transition-colors duration-200",
              hasActiveItem ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
            <span className="font-medium text-sm">{group.title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-3 w-3 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-3 w-3 transition-transform duration-200" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 space-y-1">
        {group.items.map((item: any) => {
          const isActive = pathname === item.url;
          return (
            <Link key={item.tab} href={item.url} prefetch={true}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start h-auto p-2 transition-all duration-300 rounded-lg group",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-primary/20" 
                    : "hover:bg-primary/5 hover:text-primary text-foreground border border-transparent hover:border-primary/10"
                )}
                onClick={onItemClick}
              >
                <item.icon className={cn(
                  "h-3 w-3 mr-2 transition-transform duration-200",
                  "group-hover:scale-110"
                )} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-xs">{item.title}</div>
                  <div className={cn(
                    "text-[10px] transition-colors leading-tight",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground group-hover:text-primary/70"
                  )}>{item.description}</div>
                </div>
                {item.tab === 'requests' && pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0 shadow-sm">
                    {pendingRequests}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppSidebar({
  user,
  view,
  setView,
  selectedUserId,
  setSelectedUserId,
  teachers,
  students,
  changeRequests,
  dbStatus,
  onGenerateTimetable,
  onRegisterUser,
  isGenerating,
  isLoadingData,
  currentTab,
  setCurrentTab,
}: AppSidebarProps) {
  const [open, setOpen] = React.useState(false)
  const pendingRequests = changeRequests.filter(r => r.status === 'pending').length

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground shadow-sm">
          <CatalystIcon className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold text-primary">Catalyst</span>
          <span className="truncate text-xs text-primary/70">Timetable AI</span>
        </div>
      </div>

      {/* User Profile & View Selector */}
      <div className="px-4 py-4 border-b border-border/40 bg-muted/10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/90 text-primary-foreground font-medium">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          {/* Admin View Selector */}
          {user.role === 'admin' && (
            <div className="space-y-2">
              <Select value={view} onValueChange={(v) => { setView(v as View); setSelectedUserId(null); }}>
                <SelectTrigger className="w-full border-primary/30 focus:border-primary bg-background/50 hover:bg-background/80 transition-colors">
                  <SelectValue placeholder="Select View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Admin View
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Teacher View
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Student View
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* User Selector for non-admin views */}
              {view !== 'admin' && (
                <Select value={selectedUserId || ''} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full border-primary/30 focus:border-primary bg-background/50 hover:bg-background/80 transition-colors">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    {(view === 'teacher' ? teachers : students).map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 py-4 bg-gradient-to-b from-background/80 to-background">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">Navigation</p>
          {navigationGroups[view].map((group, groupIndex) => (
            <NavigationGroup
              key={groupIndex}
              group={group}
              pendingRequests={pendingRequests}
              onItemClick={() => setOpen(false)}
            />
          ))}
        </div>

        {/* Admin Actions - Only show when admin is in admin view */}
        {user.role === 'admin' && view === 'admin' && (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground mb-3">Actions</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-primary/30 hover:border-primary hover:bg-primary/5 text-foreground transition-all duration-200 rounded-lg"
                onClick={() => {
                  onRegisterUser()
                  setOpen(false)
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register New User
              </Button>
              <Button
                size="sm"
                className="w-full justify-start bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md transition-all duration-200 rounded-lg"
                onClick={() => {
                  onGenerateTimetable()
                  setOpen(false)
                }}
                disabled={isGenerating || isLoadingData || dbStatus !== 'success'}
              >
                <CatalystIcon className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Timetable"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 px-4 py-4 bg-gradient-to-r from-muted/20 to-muted/10">
        <div className="space-y-3">
          {/* Database Status */}
          <div className="flex items-center gap-2 text-sm">
            <Database className={cn("h-4 w-4 transition-colors", 
              dbStatus === 'success' ? 'text-emerald-500' : 
              dbStatus === 'error' ? 'text-red-500' : 
              'text-amber-500'
            )} />
            <span className={cn("text-sm font-medium transition-colors",
              dbStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 
              dbStatus === 'error' ? 'text-red-600 dark:text-red-400' : 
              'text-amber-600 dark:text-amber-400'
            )}>
              {dbStatus === 'checking' && 'Connecting...'}
              {dbStatus === 'success' && 'Connected'}
              {dbStatus === 'error' && 'Error'}
            </span>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:w-80 p-0 overflow-y-auto border-r border-border/50">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen w-full">{children}</div>
}