'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, getDocs, query, where } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import type { Veiculo } from '@/lib/types';


interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

interface VehiclesState {
  vehicles: Veiculo[];
  isLoading: boolean;
  error: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null;
  // Global Vehicles State
  vehicles: Veiculo[];
  isLoadingVehicles: boolean;
  vehiclesError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  const [vehiclesState, setVehiclesState] = useState<VehiclesState>({
    vehicles: [],
    isLoading: true,
    error: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Effect to fetch all vehicles for the authenticated user
  useEffect(() => {
    const { user, isUserLoading } = userAuthState;
    if (isUserLoading || !user || !firestore) {
      // Don't fetch if user is not logged in or services are not ready
      setVehiclesState({ vehicles: [], isLoading: !user, error: null });
      return;
    }

    const fetchVehicles = async () => {
      setVehiclesState({ vehicles: [], isLoading: true, error: null });
      try {
        const clientesSnapshot = await getDocs(query(collection(firestore, 'clientes'), where('userId', '==', user.uid)));
        const allVehicles: Veiculo[] = [];
        for (const clienteDoc of clientesSnapshot.docs) {
          const veiculosSnapshot = await getDocs(collection(firestore, 'clientes', clienteDoc.id, 'veiculos'));
          veiculosSnapshot.forEach((doc) => {
            allVehicles.push(doc.data() as Veiculo);
          });
        }
        setVehiclesState({ vehicles: allVehicles, isLoading: false, error: null });
      } catch (error: any) {
        console.error("FirebaseProvider: Error fetching vehicles for user: ", error);
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'veiculos (subcollection)',
        });
        errorEmitter.emit('permission-error', contextualError);
        setVehiclesState({ vehicles: [], isLoading: false, error: contextualError });
      }
    };

    fetchVehicles();
  }, [userAuthState.user, userAuthState.isUserLoading, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      vehicles: vehiclesState.vehicles,
      isLoadingVehicles: vehiclesState.isLoading,
      vehiclesError: vehiclesState.error,
    };
  }, [firebaseApp, firestore, auth, userAuthState, vehiclesState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};

export const useVehicles = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useVehicles must be used within a FirebaseProvider.');
    }
    return {
        vehicles: context.vehicles,
        isLoading: context.isLoadingVehicles,
        error: context.vehiclesError,
    };
};
