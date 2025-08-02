import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Gavel,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Gavel className="h-8 w-8 text-violet-400 mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Auction Palace
              </span>
            </div>
            <p className="text-gray-300 mb-6">
              La plateforme d&apos;enchères moderne pour découvrir des objets uniques
              et participer à des enchères passionnantes.
            </p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Liens Rapides */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/auctions"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Enchères
                </Link>
              </li>
              <li>
                <Link
                  href="/create-auction"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Créer une Enchère
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Mon Profil
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Connexion
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Centre d&apos;Aide
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Conditions d&apos;Utilisation
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-violet-400 transition-colors"
                >
                  Politique de Confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-violet-400" />
                <span>contact@auctionpalace.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="h-4 w-4 mr-2 text-violet-400" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-2 text-violet-400" />
                <span>Paris, France</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Newsletter</h3>
              <p className="text-gray-300">
                Restez informé des nouvelles enchères
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-400"
              />
              <Button className="bg-violet-600 hover:bg-violet-700 rounded-l-none">
                S&apos;abonner
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm">
            © {currentYear} Auction Palace. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
