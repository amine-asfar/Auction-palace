"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  UserCheck,
  UserX,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  FileText,
  Clock,
  Calendar,
} from "lucide-react";
import {
  GetAllUsersVerifications,
  SetUserVerification,
} from "@/app/actions/verificationActions";

interface VerificationData {
  id: string;
  user_id: string;
  type: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export default function AdminVerificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isLoadingAdmin } = useAdmin();
  const router = useRouter();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<VerificationData[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin/verifications");
      return;
    }

    if (!isLoadingAdmin && !isAdmin) {
      router.push("/profile");
      return;
    }

    if (isAuthenticated && isAdmin) {
      loadVerifications();
    }
  }, [isAuthenticated, isLoading, isAdmin, isLoadingAdmin, router]);

  const loadVerifications = async () => {
    try {
      setIsLoadingVerifications(true);
      const data = await GetAllUsersVerifications();
      setVerifications(data);
    } catch (error) {
      console.error("Error loading verifications:", error);
      toast({
        title: "Erreur de base de données",
        description:
          "Impossible de charger les vérifications. Vérifiez que la table IdentityVerifications existe.",
        variant: "destructive",
      });

      setVerifications([]);
    } finally {
      setIsLoadingVerifications(false);
    }
  };

  const handleVerifyUser = async (verificationId: string) => {
    try {
      await SetUserVerification(verificationId, "approved");
      toast({
        title: "Utilisateur validé",
        description: "L'identité de l'utilisateur a été validée avec succès.",
      });
      loadVerifications();
    } catch (error) {
      console.error("Error approving verification:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (verificationId: string) => {
    try {
      await SetUserVerification(verificationId, "rejected");
      toast({
        title: "Utilisateur rejeté",
        description: "L'identité de l'utilisateur a été rejetée.",
        variant: "destructive",
      });
      loadVerifications();
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = (fileUrl: string) => {
    console.log("Attempting to view document:", fileUrl);

    const newWindow = window.open(fileUrl, "_blank");

    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed == "undefined"
    ) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = "verification-document";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          label: "Approuvé",
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

  if (isLoading || isLoadingAdmin) {
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

  const pendingCount = verifications.filter(
    (v) => v.status === "pending",
  ).length;
  const approvedCount = verifications.filter(
    (v) => v.status === "approved",
  ).length;
  const rejectedCount = verifications.filter(
    (v) => v.status === "rejected",
  ).length;

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Gestion des Vérifications
          </h1>
          <Badge
            variant="outline"
            className="border-indigo-200 bg-indigo-50 text-indigo-700"
          >
            <Crown className="h-4 w-4 mr-1" />
            Administrateur
          </Badge>
        </div>

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
                    {approvedCount}
                  </p>
                  <p className="text-sm text-green-600">
                    Vérifications approuvées
                  </p>
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
                  <p className="text-sm text-red-600">Vérifications rejetées</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Verifications Table */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Vérifications d&apos;identité
                </h3>
              </div>
              <Button
                onClick={loadVerifications}
                disabled={isLoadingVerifications}
                variant="outline"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {isLoadingVerifications ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-md"></div>
                ))}
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune vérification en attente</p>
              </div>
            ) : (
              <div className="rounded-lg border border-indigo-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50">
                      <TableHead className="text-indigo-700">
                        Utilisateur
                      </TableHead>
                      <TableHead className="text-indigo-700">
                        Type de document
                      </TableHead>
                      <TableHead className="text-indigo-700">Statut</TableHead>
                      <TableHead className="text-indigo-700">
                        Date de soumission
                      </TableHead>
                      <TableHead className="text-indigo-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((verification) => {
                      const statusConfig = getStatusConfig(verification.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow
                          key={verification.id}
                          className="hover:bg-indigo-50/50"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs">
                                  {verification.user_id?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">
                                  Utilisateur{" "}
                                  {verification.user_id?.slice(0, 8)}...
                                </span>
                                <p className="text-xs text-gray-500">
                                  ID: {verification.user_id}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 capitalize">
                            {verification.type}
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
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(
                                  verification.created_at,
                                ).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewDocument(verification.file_url)
                                }
                                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {verification.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleVerifyUser(verification.id)
                                    }
                                    className="hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleRejectUser(verification.id)
                                    }
                                    className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
