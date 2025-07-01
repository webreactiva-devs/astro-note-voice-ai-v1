import type { User } from "better-auth/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/LogoutButton";
import { User as UserIcon, Mail, Calendar } from "lucide-react";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Información del Usuario
          </CardTitle>
          <CardDescription>
            Detalles de tu cuenta y perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                Nombre
              </div>
              <p className="text-lg">{user.name || "Sin nombre"}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="text-lg">{user.email}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Registrado
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Actualizado
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
          
          {user.emailVerified && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              Email verificado
            </div>
          )}
          
          <div className="pt-4 border-t">
            <LogoutButton className="w-full sm:w-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}