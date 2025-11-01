'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initiateAnonymousSignIn } from './non-blocking-login';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // When the provider mounts, check the auth state.
    // If no user is logged in after the initial check, sign them in anonymously.
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      // The onAuthStateChanged listener is called once on subscription,
      // and then again on any auth state change.
      // We only want to act after the initial state is determined.
      if (!user && !firebaseServices.auth.currentUser) {
        initiateAnonymousSignIn(firebaseServices.auth);
      }
    });

    // Clean up the subscription on unmount.
    return () => unsubscribe();
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
