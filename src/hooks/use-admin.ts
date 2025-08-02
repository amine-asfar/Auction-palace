"use client";

import { useAuth } from "@/hooks/use-auth";
import { checkAdminStatus } from "@/app/actions/userProfileActions";
import { useEffect, useState, useRef } from "react";

export function useAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  const checkedUserRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setIsLoadingAdmin(false);
        checkedUserRef.current = null;
        return;
      }

      if (checkedUserRef.current === user.id || isCheckingRef.current) {
        return;
      }

      try {
        isCheckingRef.current = true;
        setIsLoadingAdmin(true);

        const isUserAdmin = await checkAdminStatus(user.id);
        setIsAdmin(isUserAdmin);
        checkedUserRef.current = user.id;
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoadingAdmin(false);
        isCheckingRef.current = false;
      }
    };

    checkAdmin();
  }, [user, isAuthenticated]);

  return {
    isAdmin,
    isLoadingAdmin: isLoading || isLoadingAdmin,
  };
}
