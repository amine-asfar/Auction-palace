"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeBids, RealtimeBid } from "@/hooks/use-realtime-bids";
import { cn } from "@/lib/utils";
import { Clock, Zap, TrendingUp, User, Trophy, Gavel } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getProductById } from "@/app/actions/productActions";
import { placeBid as placeBidAction } from "@/app/actions/bidActions";
import { RealtimeStatus } from "@/components/realtime-status";
import { checkIfUserWonAuction } from "@/app/actions/auctionHelpers";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

interface Seller {
  id: string;
  name: string;
  rating: number;
  sales: number;
  joined: string;
  image: string;
}

interface Specification {
  name: string;
  value: string;
}

interface SimilarItem {
  id: string;
  title: string;
  image: string;
  price: number;
}

interface AuctionData {
  id: string;
  title: string;
  description: string;
  images: string[];
  current_price: number;
  starting_price: number;
  min_bid_increment: number;
  end_time: Date;
  seller: Seller;
  specifications: Specification[];
  similarItems: SimilarItem[];
}

export default function AuctionDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false);
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [winnerChecked, setWinnerChecked] = useState<boolean>(false);
  const [newBidAnimation, setNewBidAnimation] = useState<string | null>(null);

  const loadedAuctionRef = useRef<string | null>(null);
  const isLoadingAuctionRef = useRef(false);
  const winnerCheckInProgressRef = useRef(false);

  const auctionRef = useRef(auction);
  const auctionEndedRef = useRef(auctionEnded);
  const userRef = useRef(user);
  const winnerCheckedRef = useRef(winnerChecked);

  useEffect(() => {
    auctionRef.current = auction;
  }, [auction]);

  useEffect(() => {
    auctionEndedRef.current = auctionEnded;
  }, [auctionEnded]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    winnerCheckedRef.current = winnerChecked;
  }, [winnerChecked]);

  useEffect(() => {
    return () => {
      isLoadingAuctionRef.current = false;
      winnerCheckInProgressRef.current = false;
    };
  }, [params.id]);

  const {
    bids,
    currentPrice,
    isLoading: bidsLoading,
    error: bidsError,
    isConnected,
  } = useRealtimeBids(params.id as string);

  useEffect(() => {
    if (bids.length > 0) {
      const latestBid = bids[0];
      setNewBidAnimation(latestBid.id);
      setTimeout(() => setNewBidAnimation(null), 2000);
    }
  }, [bids]);

  useEffect(() => {
    const auctionId = params.id as string;

    if (
      !auctionId ||
      loadedAuctionRef.current === auctionId ||
      isLoadingAuctionRef.current
    ) {
      return;
    }

    const loadAuctionData = async () => {
      try {
        isLoadingAuctionRef.current = true;
        setIsLoading(true);

        setWinnerChecked(false);

        const auctionData = await getProductById(auctionId);
        const supabase = createClient();

        if (!auctionData) {
          setError("Enchère introuvable");
          setIsLoading(false);
          isLoadingAuctionRef.current = false;
          return;
        }

        const { data: sellerProfile } = await (await supabase)
          .from("UserProfiles")
          .select("name, family_name")
          .eq("user_id", auctionData.user_id)
          .single();

        let sellerName = `Utilisateur ${auctionData.user_id.substring(0, 8)}`;

        if (sellerProfile?.name && sellerProfile?.family_name) {
          sellerName = `${sellerProfile.name} ${sellerProfile.family_name}`;
        } else if (sellerProfile?.name) {
          sellerName = sellerProfile.name;
        } else if (sellerProfile?.family_name) {
          sellerName = sellerProfile.family_name;
        }

        setAuction({
          ...auctionData,
          images: [auctionData.image],
          min_bid_increment:
            auctionData.min_bid_increment ||
            Math.ceil(auctionData.starting_price * 0.1),
          seller: {
            id: auctionData.user_id,
            name: sellerName,
            rating: 4.9,
            sales: 156,
            joined: "Mars 2018",
            image:
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop",
          },
          specifications: [],
          similarItems: [],
        });

        loadedAuctionRef.current = auctionId;
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de l'enchère",
        );
        setIsLoading(false);
      } finally {
        isLoadingAuctionRef.current = false;
      }
    };

    loadAuctionData();
  }, [params.id]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getUserName = (bid: RealtimeBid): string => {
    if (user && bid.user_id === user.id) {
      return "Vous";
    }

    if (bid.UserProfiles && bid.UserProfiles.length > 0) {
      const profile = bid.UserProfiles[0];
      const name = profile.name?.trim() || "";
      const familyName = profile.family_name?.trim() || "";

      if (process.env.NODE_ENV === "development") {
        console.log("Profile data:", {
          name,
          familyName,
          fullName: `${name} ${familyName}`,
          user_id: bid.user_id,
        });
      }

      if (name && familyName) {
        if (name.toLowerCase() === familyName.toLowerCase()) {
          return name;
        }

        if (name.includes(familyName) || familyName.includes(name)) {
          return name.length >= familyName.length ? name : familyName;
        }
        return `${name} ${familyName}`;
      } else if (name) {
        return name;
      } else if (familyName) {
        return familyName;
      }
    }

    const shortId = bid.user_id.substring(0, 8);
    return `Enchérisseur ${shortId}`;
  };

  const updateTimeLeft = () => {
    const currentAuction = auctionRef.current;
    const currentAuctionEnded = auctionEndedRef.current;
    const currentUser = userRef.current;

    if (!currentAuction) return;

    const now = new Date();
    const endTime = new Date(currentAuction.end_time);
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft("Enchère terminée");

      if (
        !currentAuctionEnded &&
        currentUser &&
        !winnerCheckedRef.current &&
        !winnerCheckInProgressRef.current
      ) {
        setAuctionEnded(true);
        setWinnerChecked(true);
        winnerCheckInProgressRef.current = true;

        checkIfUserWonAuction(currentAuction.id, currentUser.id)
          .then((won) => {
            setIsWinner(won);
          })
          .catch(() => {})
          .finally(() => {
            winnerCheckInProgressRef.current = false;
          });
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let timeString = "";
    if (days > 0) timeString += `${days}j `;
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    timeString += `${seconds}s`;

    setTimeLeft(timeString);
  };

  useEffect(() => {
    const timer = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBid = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour enchérir",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!auction || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    if (amount <= currentPrice) {
      toast({
        title: "Montant trop bas",
        description: `L&apos;enchère doit être supérieure à ${formatCurrency(currentPrice)}`,
        variant: "destructive",
      });
      return;
    }

    if (amount < currentPrice + auction.min_bid_increment) {
      toast({
        title: "Montant trop bas",
        description: `L&apos;enchère minimum est de ${formatCurrency(currentPrice + auction.min_bid_increment)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      await placeBidAction(auction.id, user.id, amount);

      setBidAmount("");

      toast({
        title: "Enchère placée !",
        description: `Votre enchère de ${formatCurrency(amount)} a été placée avec succès.`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors de l'enchère. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const getTimeLeftColor = () => {
    if (!auction) return "text-gray-600";

    const now = new Date();
    const endTime = new Date(auction.end_time);
    const diff = endTime.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return "text-red-600 animate-pulse";
    if (hours < 24) return "text-orange-600";
    return "text-white-600";
  };

  if (isLoading || bidsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-transparent "
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Chargement de l&apos;enchère
              </h2>
              <p className="text-gray-600">
                Préparation de l&apos;expérience en temps réel...
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
        <div className="container py-8">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Gavel className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Enchère introuvable
            </h2>
            <p className="text-gray-600 mb-6">
              Cette enchère n&apos;existe pas ou a été supprimée.
            </p>
            <Button
              onClick={() => router.push("/auctions")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              Retour aux enchères
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="container py-8">
        {/* Status bar */}
        <motion.div
          className="mb-6 flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <RealtimeStatus
            isConnected={isConnected}
            lastBidTime={bids[0]?.created_at}
            error={bidsError}
            className="text-sm"
          />
          <div className="flex items-center gap-4">
            {!isConnected && (
              <Badge
                variant="outline"
                className="border-yellow-400 text-yellow-700 bg-yellow-50"
              >
                <Zap className="h-3 w-3 mr-1" />
                Reconnexion...
              </Badge>
            )}
            {bidsError && (
              <Badge
                variant="destructive"
                className="bg-red-50 text-red-700 border-red-200"
              >
                Erreur de connexion
              </Badge>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Images - 3 colonnes sur xl */}
          <motion.div
            className="xl:col-span-3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-4">
              {/* Image principale */}
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-violet-100 shadow-xl bg-white group">
                <Image
                  src={auction.images[selectedImage]}
                  alt={auction.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Badge d'activité */}
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                  🔥 Enchère active
                </div>

                {/* Badge de prix */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <p className="text-sm font-medium text-gray-700">
                    Prix actuel
                  </p>
                  <p className="text-lg font-bold text-violet-600">
                    {formatCurrency(currentPrice)}
                  </p>
                </div>
              </div>

              {/* Vignettes */}
              <div className="flex space-x-3 overflow-auto pb-2">
                {auction.images.map((image, index) => (
                  <motion.button
                    key={index}
                    className={cn(
                      "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 shadow-md transition-all duration-300",
                      selectedImage === index
                        ? "ring-2 ring-violet-500 border-violet-300 scale-105"
                        : "border-gray-200 hover:border-violet-300 hover:scale-102",
                    )}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src={image}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Informations et enchères - 2 colonnes sur xl */}
          <motion.div
            className="xl:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* En-tête produit */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 shadow-lg">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
                {auction.title}
              </h1>

              {/* Stats des enchères */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl">
                  <Gavel className="h-6 w-6 text-violet-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-violet-700">
                    Enchères
                  </p>
                  <p className="text-xl font-bold text-violet-900">
                    {bids.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <User className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">
                    Enchérisseurs
                  </p>
                  <p className="text-xl font-bold text-purple-900">
                    {new Set(bids.map((b) => b.user_id)).size}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel d'enchères principal */}
            <motion.div
              layout
              className="bg-gradient-to-br from-white to-violet-50/30 backdrop-blur-sm rounded-2xl border border-violet-200 shadow-xl overflow-hidden"
            >
              {/* Header avec prix et timer */}
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 animate-pulse" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-violet-100 text-sm font-medium mb-1">
                        Enchère actuelle
                      </p>
                      <motion.p
                        className="text-4xl font-bold"
                        key={currentPrice}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {formatCurrency(currentPrice)}
                      </motion.p>
                    </div>
                    <div className="text-right">
                      <p className="text-violet-100 text-sm font-medium mb-1">
                        Prix de départ
                      </p>
                      <p className="text-xl font-semibold opacity-80">
                        {formatCurrency(auction.starting_price)}
                      </p>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <Clock className="h-5 w-5 mr-2" />
                    <span
                      className={cn("text-lg font-bold", getTimeLeftColor())}
                    >
                      {timeLeft}
                    </span>
                  </div>
                </div>
              </div>

              {/* Corps du panel */}
              <div className="p-6">
                {/* Activité récente */}
                <AnimatePresence>
                  {bids.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-violet-600" />
                        <span className="font-medium text-violet-900">
                          Activité récente
                        </span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {bids.slice(0, 5).map((bid, index) => (
                          <motion.div
                            key={bid.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale:
                                newBidAnimation === bid.id ? [1, 1.02, 1] : 1,
                            }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={cn(
                              "flex justify-between items-center p-3 rounded-xl transition-all duration-300",
                              index === 0
                                ? "bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200"
                                : "bg-gray-50 border border-gray-200",
                              newBidAnimation === bid.id &&
                                "ring-2 ring-violet-400 shadow-lg",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                  index === 0
                                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                                    : "bg-gray-300 text-gray-600",
                                )}
                              >
                                {index === 0 ? (
                                  <Trophy className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {getUserName(bid)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    bid.created_at,
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "font-bold",
                                  index === 0
                                    ? "text-violet-600 text-lg"
                                    : "text-gray-700",
                                )}
                              >
                                {formatCurrency(bid.bid_amount)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Interface d'enchère */}
                {auctionEnded ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {isWinner ? (
                      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-green-800 mb-2">
                          🎉 Félicitations !
                        </h3>
                        <p className="text-green-700 mb-4">
                          Vous avez remporté cette enchère !
                        </p>
                        <Button
                          onClick={() => router.push(`/payment/${params.id}`)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                          size="lg"
                        >
                          💳 Procéder au paiement
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Enchère terminée
                        </h3>
                        <p className="text-gray-600">
                          Cette enchère est maintenant fermée.
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                      <p className="text-sm text-violet-700 mb-2">
                        Enchère minimum
                      </p>
                      <p className="text-2xl font-bold text-violet-900">
                        {formatCurrency(
                          currentPrice + auction.min_bid_increment,
                        )}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Input
                        type="number"
                        placeholder={`${currentPrice + auction.min_bid_increment}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={currentPrice + auction.min_bid_increment}
                        step={auction.min_bid_increment}
                        className="flex-1 border-violet-200 focus:border-violet-500 focus:ring-violet-300 text-lg h-12"
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleBid}
                          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 h-12 text-lg font-semibold shadow-lg"
                          disabled={
                            !bidAmount ||
                            parseFloat(bidAmount) <
                              currentPrice + auction.min_bid_increment
                          }
                        >
                          <Gavel className="h-5 w-5 mr-2" />
                          Enchérir
                        </Button>
                      </motion.div>
                    </div>

                    <p className="text-sm text-center text-violet-600 bg-violet-50 p-2 rounded-lg">
                      💡 Entrez{" "}
                      {formatCurrency(currentPrice + auction.min_bid_increment)}{" "}
                      ou plus pour enchérir
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Onglets d'information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Tabs
                defaultValue="description"
                className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-violet-100 shadow-lg"
              >
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-violet-50 to-purple-50 p-1 m-0 h-12">
                  <TabsTrigger
                    value="description"
                    className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md font-medium"
                  >
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="bids"
                    className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md font-medium"
                  >
                    Historique
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md font-medium"
                  >
                    Détails
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="description"
                  className="mt-6 bg-white p-6 rounded-xl shadow-sm"
                >
                  <div className="prose max-w-none">
                    <p className="text-gray-700">{auction.description}</p>
                  </div>
                </TabsContent>

                <TabsContent value="bids" className="p-0 m-0">
                  <div className="divide-y divide-violet-100">
                    <div className="grid grid-cols-3 p-4 font-medium bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700">
                      <div>Enchérisseur</div>
                      <div>Montant</div>
                      <div>Temps</div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {bids.length > 0 ? (
                        bids.map((bid, index) => (
                          <motion.div
                            key={bid.id}
                            className="grid grid-cols-3 p-4 hover:bg-violet-50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                  index === 0
                                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                                    : "bg-gray-200 text-gray-600",
                                )}
                              >
                                {index + 1}
                              </div>
                              <span className="text-violet-700 font-medium">
                                {getUserName(bid)}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "font-semibold",
                                index === 0
                                  ? "text-violet-600"
                                  : "text-gray-900",
                              )}
                            >
                              {formatCurrency(bid.bid_amount)}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {new Date(bid.created_at).toLocaleString("fr-FR")}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Gavel className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">
                            Aucune enchère pour le moment
                          </p>
                          <p className="text-sm">
                            Soyez le premier à enchérir !
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="p-6 m-0">
                  <div className="space-y-6">
                    {/* Vendeur */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="h-5 w-5 text-violet-600" />
                        Vendeur
                      </h3>
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                        <div className="h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center ring-2 ring-violet-200">
                          <User className="h-8 w-8 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-violet-900">
                            {auction.seller.name}
                          </p>

                          <div className="flex items-center gap-4 mt-1">
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              Compte actif
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Détails de l'enchère */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Gavel className="h-5 w-5 text-violet-600" />
                        Détails de l&apos;enchère
                      </h3>
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                        <dl className="space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-gray-600 flex items-center gap-1">
                              💰 Prix de départ
                            </dt>
                            <dd className="font-semibold text-gray-900">
                              {formatCurrency(auction.starting_price)}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600 flex items-center gap-1">
                              📈 Incrément minimum
                            </dt>
                            <dd className="font-semibold text-gray-900">
                              {formatCurrency(auction.min_bid_increment)}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600 flex items-center gap-1">
                              ⏰ Date de fin
                            </dt>
                            <dd className="font-semibold text-gray-900">
                              {new Date(auction.end_time).toLocaleString(
                                "fr-FR",
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
