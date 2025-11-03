'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import type { Veiculo, Cliente } from '@/lib/types';


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
export interface UserHookResult { 
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

  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { 
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); 

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { 
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { 
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); 
  }, [auth]); 

  // Effect to fetch clients for the authenticated user
  useEffect(() => {
      const { user, isUserLoading } = userAuthState;
      if (isUserLoading || !user || !firestore) {
          setClients([]);
          setIsLoadingClients(!user);
          return;
      }
      setIsLoadingClients(true);
      const clientsQuery = query(collection(firestore, 'clientes'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
          const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
          setClients(clientsData);
          setIsLoadingClients(false);
      }, (error) => {
          console.error("FirebaseProvider: Error fetching clients:", error);
          setClients([]);
          setIsLoadingClients(false);
      });

      return () => unsubscribe();
  }, [userAuthState.user, userAuthState.isUserLoading, firestore]);

  // Effect to fetch all vehicles for the authenticated user based on their clients
  useEffect(() => {
    const { user, isUserLoading } = userAuthState;
    
    if (isUserLoading || isLoadingClients || !user) {
        return; // Wait until user and clients are loaded
    }

    if (clients.length === 0) {
      setVehiclesState({ vehicles: [], isLoading: false, error: null });
      return;
    }

    setVehiclesState(prevState => ({ ...prevState, isLoading: true }));
    const unsubscribers: (() => void)[] = [];
    let allVehicles: Veiculo[] = [];
    let clientQueriesFinished = 0;

    clients.forEach(cliente => {
        const vehiclesQuery = collection(firestore, 'clientes', cliente.id, 'veiculos');
        const unsubscribe = onSnapshot(vehiclesQuery, (snapshot) => {
            // This logic is tricky with multiple listeners. A better approach is to manage updates per client.
            // For now, let's rebuild the list on each snapshot for simplicity.
            
            // Filter out old vehicles for this client
            allVehicles = allVehicles.filter(v => v.clienteId !== cliente.id);

            // Add new/updated vehicles for this client
            snapshot.forEach((doc) => {
                allVehicles.push(doc.data() as Veiculo);
            });
            
            // This might cause multiple re-renders but is safer.
            setVehiclesState(prevState => ({ ...prevState, vehicles: [...allVehicles] }));

        }, (error) => {
            console.error(`FirebaseProvider: Error fetching vehicles for client ${cliente.id}:`, error);
            // Don't stop all vehicle loading if one client fails, but log the error
            setVehiclesState(prevState => ({...prevState, error: error as Error }));
        });
        unsubscribers.push(unsubscribe);
    });

    // A simple way to handle loading state across multiple async listeners
    Promise.all(clients.map(c => new Promise(res => {
      const q = collection(firestore, 'clientes', c.id, 'veiculos');
      const unsub = onSnapshot(q, () => {
        // We only care about the initial load signal.
        unsub(); 
        res(true);
      }, () => {
        // Also resolve on error to not block loading forever
        unsub();
        res(true);
      });
    }))).then(() => {
       setVehiclesState(prevState => ({ ...prevState, isLoading: false }));
    });


    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [clients, isLoadingClients, userAuthState.user, userAuthState.isUserLoading, firestore]);

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
export const useUser = (): UserHookResult => { 
  const { user, isUserLoading, userError } = useFirebase(); 
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
