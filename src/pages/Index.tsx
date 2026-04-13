import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "agent") return <Navigate to="/agent" replace />;

  return <Navigate to="/login" replace />;
}
