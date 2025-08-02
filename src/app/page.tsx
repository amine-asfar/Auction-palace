"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Gavel,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Play,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Gavel className="h-6 w-6" />,
      title: "Enchères en Temps Réel",
      description:
        "Participez à des enchères live avec des mises à jour instantanées",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Paiements Sécurisés",
      description:
        "Transactions protégées avec Stripe et authentification robuste",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Prix Concurrentiels",
      description:
        "Obtenez les meilleurs prix grâce à notre système d'enchères transparent",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Expiration Automatique",
      description: "Les enchères se terminent automatiquement à l'heure prévue",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Communauté Active",
      description: "Rejoignez une communauté d'enchérisseurs passionnés",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Interface Moderne",
      description: "Design épuré et responsive pour une expérience optimale",
    },
  ];

  const stats = [
    { number: "500+", label: "Enchères Actives" },
    { number: "10K+", label: "Utilisateurs" },
    { number: "€2M+", label: "Volume Total" },
    { number: "99%", label: "Satisfaction" },
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Collectionneuse",
      text: "Auction Palace m'a permis de trouver des pièces uniques que je n'aurais jamais découvertes ailleurs.",
    },
    {
      name: "Jean Martin",
      role: "Expert en Art",
      text: "La plateforme est intuitive et les enchères sont transparentes. Je recommande vivement !",
    },
    {
      name: "Sophie Laurent",
      role: "Antiquaire",
      text: "Une expérience d'enchères moderne et sécurisée. Parfait pour les professionnels.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-purple-600/10 pointer-events-none"></div>

        {/* Background Images */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-violet-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-indigo-400 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200">
                  <Star className="h-3 w-3 mr-1" />
                  Plateforme d'enchères premium
                </Badge>

                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-6">
                  Auction Palace
                </h1>

                <p className="text-xl md:text-2xl text-gray-600 mb-8">
                  Découvrez des objets uniques et participez à des enchères
                  passionnantes. Une expérience moderne et sécurisée pour tous
                  les collectionneurs.
                </p>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link href="/auctions" className="inline-block">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 text-lg group"
                  >
                    Découvrir les Enchères
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                {!user && (
                  <Link href="/auth/register" className="inline-block">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 px-8 py-4 text-lg group"
                    >
                      Créer un Compte
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Stats mini */}
              <div className="flex justify-center lg:justify-start space-x-8 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-violet-600">500+</div>
                  <div className="text-gray-500">Enchères</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">10K+</div>
                  <div className="text-gray-500">Utilisateurs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">99%</div>
                  <div className="text-gray-500">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-3xl pointer-events-none"></div>
                <Image
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop"
                  alt="Auction Palace"
                  width={600}
                  height={400}
                  className="rounded-3xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl pointer-events-none"></div>

                {/* Floating Elements */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg pointer-events-none">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Enchère Active</span>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg pointer-events-none">
                  <div className="text-center">
                    <div className="text-lg font-bold text-violet-600">
                      €2,450
                    </div>
                    <div className="text-xs text-gray-600">Prix actuel</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Auction Palace ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme moderne conçue pour offrir la meilleure expérience
              d'enchères
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 h-full border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-violet-100 rounded-lg text-violet-600 mr-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-xl text-violet-100 max-w-2xl mx-auto">
              Découvrez les témoignages de notre communauté d'enchérisseurs
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 h-full bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-violet-200/20 rounded-full flex items-center justify-center mr-4">
                      <span className="text-violet-200 font-semibold text-lg">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-violet-200 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-violet-100">"{testimonial.text}"</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Prêt à Commencer ?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Rejoignez notre communauté d'enchérisseurs et découvrez des objets
              uniques
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auctions" className="inline-block">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 text-lg group"
                >
                  Explorer les Enchères
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/register" className="inline-block">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 px-8 py-4 text-lg group"
                  >
                    Créer un Compte
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
