"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Crown,
} from "lucide-react";

interface AdminProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin";
}

interface UserForVerification {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  identity_status: "pending" | "verified" | "rejected";
  identity_document_url?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = true;

  const adminProfile: AdminProfile = {
    id: user?.id || "1",
    email: user?.email || "admin@auction-palace.com",
    first_name: "Admin",
    last_name: "Système",
    role: "admin",
  };

  const [usersToVerify, setUsersToVerify] = useState<UserForVerification[]>([
    {
      id: "2",
      email: "jean.dupont@email.com",
      first_name: "Jean",
      last_name: "Dupont",
      identity_status: "pending",
      identity_document_url: "https://example.com/doc1.pdf",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "3",
      email: "marie.martin@email.com",
      first_name: "Marie",
      last_name: "Martin",
      identity_status: "verified",
      identity_document_url: "https://example.com/doc2.pdf",
      created_at: "2024-01-14T09:30:00Z",
      updated_at: "2024-01-16T14:20:00Z",
    },
    {
      id: "4",
      email: "pierre.bernard@email.com",
      first_name: "Pierre",
      last_name: "Bernard",
      identity_status: "rejected",
      identity_document_url: "https://example.com/doc3.pdf",
      created_at: "2024-01-13T16:15:00Z",
      updated_at: "2024-01-17T11:45:00Z",
    },
    {
      id: "5",
      email: "sophie.rousseau@email.com",
      first_name: "Sophie",
      last_name: "Rousseau",
      identity_status: "pending",
      identity_document_url: "https://example.com/doc4.pdf",
      created_at: "2024-01-18T08:00:00Z",
      updated_at: "2024-01-18T08:00:00Z",
    },
    {
      id: "6",
      email: "lucas.garcia@email.com",
      first_name: "Lucas",
      last_name: "Garcia",
      identity_status: "pending",
      created_at: "2024-01-19T12:30:00Z",
      updated_at: "2024-01-19T12:30:00Z",
    },
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin/profile");
    }
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/profile");
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  const getIdentityStatusConfig = (status: string) => {
    switch (status) {
      case "verified":
        return {
          label: "Validé",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
        };
      case "rejected":
        return {
          label: "Rejeté",
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
        };
      default:
        return {
          label: "En attente",
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          borderColor: "border-orange-200",
        };
    }
  };

  const handleVerifyUser = (userId: string) => {
    setUsersToVerify((users) =>
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              identity_status: "verified" as const,
              updated_at: new Date().toISOString(),
            }
          : user,
      ),
    );
    toast({
      title: "Utilisateur validé",
      description: "L'identité de l'utilisateur a été validée avec succès.",
    });
  };

  const handleRejectUser = (userId: string) => {
    setUsersToVerify((users) =>
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              identity_status: "rejected" as const,
              updated_at: new Date().toISOString(),
            }
          : user,
      ),
    );
    toast({
      title: "Utilisateur rejeté",
      description: "L'identité de l'utilisateur a été rejetée.",
      variant: "destructive",
    });
  };

  const handleDeleteDocument = (userId: string) => {
    setUsersToVerify((users) =>
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              identity_document_url: undefined,
              identity_status: "pending" as const,
              updated_at: new Date().toISOString(),
            }
          : user,
      ),
    );
    toast({
      title: "Document supprimé",
      description: "Le document d'identité a été supprimé.",
    });
  };

  const handleViewDocument = (documentUrl?: string) => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    } else {
      toast({
        title: "Aucun document",
        description:
          "Aucun document d'identité n'est disponible pour cet utilisateur.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-md w-64 mb-6"></div>
            <Card className="p-8">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded-md w-full"></div>
                <div className="h-4 bg-muted rounded-md w-3/4"></div>
                <div className="h-4 bg-muted rounded-md w-1/2"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const pendingCount = usersToVerify.filter(
    (user) => user.identity_status === "pending",
  ).length;
  const verifiedCount = usersToVerify.filter(
    (user) => user.identity_status === "verified",
  ).length;
  const rejectedCount = usersToVerify.filter(
    (user) => user.identity_status === "rejected",
  ).length;

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Panneau d'Administration
          </h1>
          <Badge
            variant="outline"
            className="border-indigo-200 bg-indigo-50 text-indigo-700"
          >
            <Crown className="h-4 w-4 mr-1" />
            Administrateur
          </Badge>
        </div>

        {/* Admin Profile Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-indigo-100">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white text-lg">
                  {adminProfile.first_name.charAt(0)}
                  {adminProfile.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {adminProfile.first_name} {adminProfile.last_name}
                </h2>
                <p className="text-gray-600 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {adminProfile.email}
                </p>
                <p className="text-sm text-indigo-600 mt-1 flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Administrateur système
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-orange-100 bg-orange-50">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">
                    {pendingCount}
                  </p>
                  <p className="text-sm text-orange-600">
                    En attente de validation
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="border-green-100 bg-green-50">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {verifiedCount}
                  </p>
                  <p className="text-sm text-green-600">Utilisateurs validés</p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="border-red-100 bg-red-50">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {rejectedCount}
                  </p>
                  <p className="text-sm text-red-600">Documents rejetés</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Management Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Gestion des utilisateurs
              </h3>
            </div>

            <div className="rounded-lg border border-indigo-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50">
                    <TableHead className="text-indigo-700">
                      Utilisateur
                    </TableHead>
                    <TableHead className="text-indigo-700">Email</TableHead>
                    <TableHead className="text-indigo-700">Statut</TableHead>
                    <TableHead className="text-indigo-700">
                      Date de création
                    </TableHead>
                    <TableHead className="text-indigo-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersToVerify.map((user) => {
                    const statusConfig = getIdentityStatusConfig(
                      user.identity_status,
                    );
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={user.id} className="hover:bg-indigo-50/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs">
                                {user.first_name?.charAt(0)}
                                {user.last_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : "Nom non renseigné"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(user.created_at).toLocaleDateString(
                            "fr-FR",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleViewDocument(user.identity_document_url)
                              }
                              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.identity_status !== "verified" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyUser(user.id)}
                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            {user.identity_status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectUser(user.id)}
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                            {user.identity_document_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDocument(user.id)}
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
