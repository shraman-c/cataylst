
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CatalystIcon } from "@/components/icons"

const registerSchema = z.object({
  userId: z.string().min(1, { message: "User selection is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(['admin', 'teacher', 'student']),
})

interface SelectableUser {
    id: string;
    name: string;
    studentId?: string;
    teacherId?: string;
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [availableUsers, setAvailableUsers] = React.useState<{students: SelectableUser[], teachers: SelectableUser[]}>({students: [], teachers: []});

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userId: "",
      password: "",
      role: "student",
    },
  })

  const role = form.watch("role");

  React.useEffect(() => {
    async function fetchAvailableUsers() {
      try {
        const res = await fetch('/api/auth/register');
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setAvailableUsers(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load available users for registration."
        })
      }
    }
    fetchAvailableUsers();
  }, [toast]);
  
  React.useEffect(() => {
    form.setValue('userId', '');
  }, [role, form]);


  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed")
      }

      toast({
        title: "Registration Successful",
        description: "The new user has been created.",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const userList = role === 'student' ? availableUsers.students : availableUsers.teachers;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
       <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <CatalystIcon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-headline font-semibold text-primary">Catalyst</span>
            </div>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new admin, teacher, or student to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === 'admin' ? (
                <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                        <Input placeholder="admin_username" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              ) : (
                <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{role === 'student' ? 'Student' : 'Teacher'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || userList.length === 0}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={userList.length === 0 ? `No available ${role}s` : `Select a ${role}`} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {userList.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name} ({role === 'student' ? user.studentId : user.teacherId})</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating User..." : "Create User"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
                Return to <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link>.
            </p>
        </CardFooter>
      </Card>
    </div>
  )
}
