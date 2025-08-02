"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { createReview } from "@/app/actions/reviewActions";
import { useToast } from "@/components/ui/use-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  sellerId: string;
  sellerName: string;
  productTitle: string;
  onReviewSubmitted: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  productId,
  sellerId,
  sellerName,
  productTitle,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une note",
        variant: "destructive",
      });
      return;
    }

    if (comment.trim().length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez laisser un commentaire",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await createReview(sellerId, productId, rating, comment.trim());

      toast({
        title: "Avis publié !",
        description: "Votre avis a été publié avec succès",
      });

      onReviewSubmitted();
      onClose();

      setRating(0);
      setComment("");
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setRating(0);
      setComment("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Laisser un avis</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Produit: <span className="font-medium">{productTitle}</span>
            </p>
            <p className="text-sm text-gray-600">
              Vendeur: <span className="font-medium">{sellerName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Commentaire</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience avec ce vendeur..."
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                {comment.length}/500 caractères
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || rating === 0 || comment.trim().length === 0
                }
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                {isSubmitting ? "Publication..." : "Publier l'avis"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
