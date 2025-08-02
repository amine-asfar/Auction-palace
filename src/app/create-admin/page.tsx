"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { promoteToAdmin } from "@/app/actions/userProfileActions";
import { useAuth } from "@/hooks/use-auth";

export default function CreateAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour devenir administrateur.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await promoteToAdmin(user.id);
      toast({
        title: "Succès",
        description: "Vous êtes maintenant administrateur!",
      });
      router.push("/admin/verifications");
    } catch (error) {
      console.error("Error promoting to admin:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de promouvoir en administrateur. Vérifiez votre profil utilisateur.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          Créer un Administrateur
        </h1>

        <div className="space-y-4">
          <p className="text-gray-600">
            Cette page permet de promouvoir l&apos;utilisateur actuellement
            connecté au rôle d&apos;administrateur.
          </p>

          <Button
            onClick={handlePromoteToAdmin}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            disabled={isLoading || !user}
          >
            {isLoading
              ? "Promotion en cours..."
              : "Me promouvoir Administrateur"}
          </Button>

          <div className="text-sm text-gray-500 mt-4">
            <p>
              <strong>Note:</strong> Vous devez être connecté pour utiliser
              cette fonction.
            </p>
            <p>
              Après promotion, vous aurez accès à la page de vérifications
              admin.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
