"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  getUserProfile,
  getUserPurchaseHistory,
  getUserStats,
  UserProfileData,
  PurchaseHistoryItem,
} from "@/app/actions/profileActions";
import {
  getUserReviews,
  getReviewableAuctions,
  getUserRating,
  Review,
  ReviewableAuction,
} from "@/app/actions/reviewActions";
import {
  getPaymentHistory,
  syncAllUserPaymentsWithStripe,
} from "@/app/actions/paymentActions";
import { ReviewModal } from "@/components/review-modal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Settings,
  Award,
  TrendingUp,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  Edit3,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>(
    [],
  );
  const [userStats, setUserStats] = useState({
    totalBids: 0,
    totalWon: 0,
    totalSpent: 0,
    totalCreated: 0,
  });
  const [userRating, setUserRating] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [reviewableAuctions, setReviewableAuctions] = useState<
    ReviewableAuction[]
  >([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] =
    useState<ReviewableAuction | null>(null);

  const loadedUserRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user) return;

      if (loadedUserRef.current === user.id || isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoadingProfile(true);

        const [profile, history, stats, rating, reviews, reviewable, payments] =
          await Promise.all([
            getUserProfile(user.id),
            getUserPurchaseHistory(user.id),
            getUserStats(user.id),
            getUserRating(user.id),
            getUserReviews(user.id),
            getReviewableAuctions(user.id),
            getPaymentHistory(user.id),
          ]);

        if (profile) setUserProfile(profile);
        setPurchaseHistory(history);
        setUserStats(stats);
        setUserRating(rating);
        setUserReviews(reviews);
        setReviewableAuctions(reviewable);
        setPaymentHistory(payments);
        loadedUserRef.current = user.id;
      } catch {
      } finally {
        setIsLoadingProfile(false);
        isLoadingRef.current = false;
      }
    };

    loadUserData();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const autoSyncPayments = async () => {
      try {
        const pendingPayments = paymentHistory.filter(
          (p) =>
            p.status === "pending" &&
            p.stripe_intent_id &&
            !p.stripe_intent_id.startsWith("fake_"),
        );

        if (pendingPayments.length > 0) {
          console.log(
            `🔄 Auto-syncing ${pendingPayments.length} pending payments...`,
          );

          const result = await syncAllUserPaymentsWithStripe(user.id);

          if (result.updated > 0) {
            const updatedPayments = await getPaymentHistory(user.id);
            setPaymentHistory(updatedPayments);
          }
        }
      } catch (error) {
        console.error("❌ Auto-sync failed:", error);
      }
    };

    const initialDelay = setTimeout(autoSyncPayments, 2000);

    const interval = setInterval(autoSyncPayments, 30000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [user, isAuthenticated, paymentHistory]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/profile");
    }
  }, [isAuthenticated, isLoading, router]);

  const getIdentityStatusConfig = (status: string) => {
    switch (status) {
      case "verified":
        return {
          label: "Identité validée",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "rejected":
        return {
          label: "Identité rejetée",
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          label: "Identité en cours de validation",
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
        };
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-md w-48 mb-6"></div>
            <Card className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-32 w-32 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded-md w-24"></div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-muted rounded-md w-full"></div>
                  <div className="h-4 bg-muted rounded-md w-3/4"></div>
                  <div className="h-4 bg-muted rounded-md w-1/2"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Mon Profil
          </h1>
        </div>

        {/* Main Profile Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-indigo-100 shadow-lg">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || ""}
                      alt={user?.user_metadata?.name || "Utilisateur"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white text-2xl">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Compte vérifié
                </Badge>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {userProfile?.name && userProfile?.family_name
                      ? `${userProfile.name} ${userProfile.family_name}`
                      : user?.user_metadata?.name || "Utilisateur"}
                  </h2>
                  <p className="text-gray-600">
                    Membre depuis{" "}
                    {new Date(user?.created_at || "").toLocaleDateString(
                      "fr-FR",
                      {
                        year: "numeric",
                        month: "long",
                      },
                    )}
                  </p>
                </div>

                <Separator className="bg-indigo-100" />

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <Mail className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Email
                        </p>
                        <p className="text-sm text-gray-600">
                          {userProfile?.email || user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <User className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Nom complet
                        </p>
                        <p className="text-sm text-gray-600">
                          {userProfile?.name && userProfile?.family_name
                            ? `${userProfile.name} ${userProfile.family_name}`
                            : "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <MapPin className="h-5 w-5 text-indigo-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Adresse
                      </p>
                      {userProfile?.address ? (
                        <div className="text-sm text-gray-600">
                          <p>{userProfile.address}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Non renseignée</p>
                      )}
                    </div>
                  </div>

                  {/* Identity Status */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900">
                      Statut de vérification
                    </h4>
                    {(() => {
                      const statusConfig = getIdentityStatusConfig(
                        userProfile?.identity_status || "pending",
                      );
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
                        >
                          <StatusIcon
                            className={`h-5 w-5 ${statusConfig.color}`}
                          />
                          <div>
                            <p
                              className={`text-sm font-medium ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </p>
                            <p className="text-xs text-gray-600">
                              {userProfile?.identity_status === "verified"
                                ? "Votre identité a été vérifiée avec succès"
                                : userProfile?.identity_status === "rejected"
                                  ? "Veuillez soumettre à nouveau vos documents"
                                  : "Vos documents sont en cours de vérification"}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <Separator className="bg-indigo-100" />

                {/* Account Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Statistiques du compte
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-8 w-8 text-indigo-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {userStats.totalWon}
                          </p>
                          <p className="text-sm text-gray-600">
                            Enchères gagnées
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <Award className="h-8 w-8 text-violet-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {userStats.totalCreated}
                          </p>
                          <p className="text-sm text-gray-600">
                            Enchères créées
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-indigo-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {userStats.totalSpent.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total des achats
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Combined Order & Payment History */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Mes enchères gagnées
              </h3>
            </div>

            {(() => {
              const allOrders = [
                ...paymentHistory.map((payment: any) => ({
                  id: payment.id,
                  type: "payment",
                  title: payment.product?.title || "Produit supprimé",
                  image: payment.product?.image,
                  amount: payment.amount,
                  date: payment.created_at,
                  status: payment.status,
                  stripe_intent_id: payment.stripe_intent_id,
                  product_id: payment.product_id || payment.product?.id,
                  reference: payment.id.slice(0, 8),
                })),

                ...purchaseHistory
                  .filter((purchase: PurchaseHistoryItem) => {
                    return !paymentHistory.some(
                      (payment: any) =>
                        (payment.product_id || payment.product?.id) ===
                        purchase.product_id,
                    );
                  })
                  .map((purchase: PurchaseHistoryItem) => ({
                    id: purchase.id,
                    type: "purchase",
                    title: purchase.product_title,
                    image: purchase.product_image,
                    amount: purchase.purchase_price,
                    date: purchase.purchase_date,
                    status: "pending",
                    product_id: purchase.product_id,
                    reference: purchase.id.slice(0, 8),
                  })),
              ].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              );

              return allOrders.length > 0 ? (
                <div className="space-y-4">
                  {allOrders.map((order: any) => (
                    <div
                      key={`${order.type}-${order.id}`}
                      className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {order.image && (
                              <img
                                src={order.image || "/placeholder-image.jpg"}
                                alt={order.title}
                                className="w-16 h-16 rounded-lg object-cover border border-indigo-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder-image.jpg";
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {order.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {order.type === "payment"
                                ? "Enchère gagnée"
                                : "Achat finalisé"}{" "}
                              le{" "}
                              {new Date(order.date).toLocaleDateString(
                                "fr-FR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              Référence: {order.reference}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-indigo-600">
                            {order.amount.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "success"
                                  : "secondary"
                              }
                              className={
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {order.status === "completed"
                                ? "Payé"
                                : "En attente"}
                            </Badge>
                            {order.stripe_intent_id && (
                              <Badge variant="outline" className="text-xs">
                                {order.stripe_intent_id.startsWith("fake_")
                                  ? "Test"
                                  : "Stripe"}
                              </Badge>
                            )}
                            {order.status === "pending" && (
                              <Button
                                size="sm"
                                className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                onClick={() =>
                                  router.push(`/payment/${order.product_id}`)
                                }
                              >
                                💳 Payer maintenant
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune enchère gagnée
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Commencez à enchérir pour voir vos gains ici
                  </p>
                  <Button
                    onClick={() => router.push("/auctions")}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Découvrir les enchères
                  </Button>
                </div>
              );
            })()}
          </div>
        </Card>

        {/* Reviews Received Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Avis reçus
                </h3>
              </div>
              {userRating.totalReviews > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold ml-1">
                      {userRating.averageRating}
                    </span>
                  </div>
                  <span className="text-gray-600">
                    ({userRating.totalReviews} avis)
                  </span>
                </div>
              )}
            </div>

            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {review.reviewer_name} {review.reviewer_family_name}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-500">
                      Produit: {review.product_title}
                    </p>
                  </div>
                ))}
                {userReviews.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline">
                      Voir tous les avis ({userReviews.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucun avis pour le moment</p>
                <p className="text-sm text-gray-500">
                  Les avis de vos acheteurs apparaîtront ici
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Reviewable Auctions Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Edit3 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Laisser un avis
              </h3>
              <span className="text-sm text-gray-600">
                ({reviewableAuctions.filter((a) => a.can_review).length} en
                attente, {reviewableAuctions.length} total)
              </span>
            </div>

            {reviewableAuctions.length > 0 ? (
              <div className="space-y-4">
                {reviewableAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={
                            auction.product_image || "/placeholder-image.jpg"
                          }
                          alt={auction.product_title}
                          className="w-16 h-16 rounded-lg object-cover border border-indigo-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-image.jpg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {auction.product_title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Vendeur: {auction.seller_name}{" "}
                          {auction.seller_family_name}
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          Prix payé:{" "}
                          {auction.purchase_price.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      </div>
                      <div>
                        {auction.can_review ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAuction(auction);
                              setReviewModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                          >
                            Laisser un avis
                          </Button>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Avis laissé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucune enchère à évaluer</p>
                <p className="text-sm text-gray-500">
                  Gagnez des enchères pour pouvoir laisser des avis aux vendeurs
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Account Settings Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Paramètres du compte
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">Compte créé le</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user?.created_at || "").toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Statut de vérification
                    </p>
                    <p className="text-sm text-green-600">Email vérifié</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Review Modal */}
      {selectedAuction && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedAuction(null);
          }}
          productId={selectedAuction.product_id}
          sellerId={selectedAuction.seller_id}
          sellerName={`${selectedAuction.seller_name} ${selectedAuction.seller_family_name}`}
          productTitle={selectedAuction.product_title}
          onReviewSubmitted={() => {
            if (user) {
              getReviewableAuctions(user.id).then(setReviewableAuctions);
            }
          }}
        />
      )}
    </div>
  );
}
