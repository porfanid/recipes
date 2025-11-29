import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPendingRecipes } from "@/components/admin/AdminPendingRecipes";
import { AdminPendingPackagingIdeas } from "@/components/admin/AdminPendingPackagingIdeas";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminUsers } from "@/components/admin/AdminUsers";

const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useUserRole();

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-4xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending Recipes</TabsTrigger>
            <TabsTrigger value="packaging">Pending Packaging Ideas</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <AdminPendingRecipes />
          </TabsContent>

          <TabsContent value="packaging" className="mt-6">
            <AdminPendingPackagingIdeas />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AdminReports />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;