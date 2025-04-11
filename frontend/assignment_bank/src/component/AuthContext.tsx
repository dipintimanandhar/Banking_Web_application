// src/context/AuthContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useCallback
} from 'react';
import { googleLogout, useGoogleLogin, CodeResponse, TokenResponse } from '@react-oauth/google';
import axios from 'axios';

// Interface for the user profile data fetched from Google
// (Matches the structure from https://www.googleapis.com/oauth2/v1/userinfo)
interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

// Define the shape of the context data
interface AuthContextType {
    profile: GoogleUserInfo | null; // Holds the fetched user profile
    isLoggedIn: boolean;            // True if the user profile is loaded
    login: () => void;              // Function to initiate the Google login flow
    logout: () => void;             // Function to log the user out
    isLoading: boolean;             // True during login or profile fetching
}

// Create the React Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the provider component
interface AuthProviderProps {
    children: ReactNode;
}

// --- AuthProvider Component ---
// This component wraps parts of your app that need access to auth state
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // State to hold the token response from Google (contains access_token)
    // We use TokenResponse type which is more accurate for the success case here
    const [googleTokenResponse, setGoogleTokenResponse] = useState<Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'> | null>(null);

    // State to hold the fetched user profile information
    const [profile, setProfile] = useState<GoogleUserInfo | null>(() => {
        // Initialize state by trying to load profile from localStorage
        const storedProfile = localStorage.getItem('userProfile');
        try {
            return storedProfile ? JSON.parse(storedProfile) : null;
        } catch (error) {
            console.error("Error parsing stored user profile:", error);
            localStorage.removeItem('userProfile'); // Clear invalid data
            return null;
        }
    });

    // State to track loading status (during login initiation and profile fetching)
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // --- Login Logic ---
    const handleLoginSuccess = (tokenResponse: Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>) => {
        console.log("Google Login Success (Token obtained):", tokenResponse);
        setIsLoading(true); // Start loading indicator for profile fetch
        // Store the token response object which includes the access_token
        setGoogleTokenResponse(tokenResponse);
        // We don't set profile data here yet, it happens in the useEffect below
    };

    const handleLoginError = (error: Pick<CodeResponse, 'error' | 'error_description' | 'error_uri'>) => {
        console.error('Google Login Failed:', error);
        setIsLoading(false); // Stop loading on error
        // Consider showing an error message to the user
    };

    // Hook from @react-oauth/google to trigger the login popup/redirect
    const login = useGoogleLogin({
        onSuccess: handleLoginSuccess,
        onError: handleLoginError,
        // flow: 'implicit', // or 'auth-code'. Implicit is often simpler for client-side. Default might be 'implicit'.
    });

    // --- Profile Fetching Logic ---
    // This effect runs when the googleTokenResponse state changes (i.e., after successful login)
    useEffect(() => {
        // Check if we have an access token in the state
        if (googleTokenResponse?.access_token) {
            const accessToken = googleTokenResponse.access_token;
            console.log("Fetching Google User Info using access token...");
            setIsLoading(true); // Ensure loading is true

            axios
                .get<GoogleUserInfo>(`https://www.googleapis.com/oauth2/v1/userinfo`, { // Removed access_token from query param
                    headers: {
                        Authorization: `Bearer ${accessToken}`, // Use Authorization header
                        Accept: 'application/json',
                    },
                })
                .then((res) => {
                    // Successfully fetched profile data
                    console.log("Google User Info Fetched:", res.data);
                    setProfile(res.data); // Update profile state
                    // Persist the profile to localStorage
                    localStorage.setItem('userProfile', JSON.stringify(res.data));
                    // Clear the token response now that we have the profile
                    setGoogleTokenResponse(null);
                })
                .catch((err) => {
                    // Handle errors during profile fetch
                    console.error("Error fetching Google user info:", err);
                    setProfile(null); // Clear profile state on error
                    localStorage.removeItem('userProfile'); // Clear persisted profile
                    // Maybe trigger logout or show an error message
                })
                .finally(() => {
                    // Ensure loading state is turned off after fetch attempt
                    setIsLoading(false);
                });
        } else if (!profile && isLoading) {
           // If we thought we were loading but have no token and no profile, stop loading.
           // This handles edge cases where the effect runs without a token.
           setIsLoading(false);
        }
    }, [googleTokenResponse, profile, isLoading]); // Dependencies for the effect

    // --- Logout Logic ---
    const logout = useCallback(() => {
        console.log("Logging out...");
        googleLogout(); // Function from @react-oauth/google to clear Google session
        setGoogleTokenResponse(null); // Clear any stored token response
        setProfile(null); // Clear the profile state
        localStorage.removeItem('userProfile'); // Clear profile from storage
        setIsLoading(false); // Ensure loading is off
        console.log("User logged out.");
        // Navigation back to login page would happen in the UI components based on isLoggedIn state
    }, []); // useCallback ensures the function identity is stable unless dependencies change (none here)

    // Determine login status based on whether the profile state has data
    const isLoggedIn = !!profile;

    // --- Provide Context Value ---
    // The values and functions provided to consuming components
    const contextValue: AuthContextType = {
        profile,
        isLoggedIn,
        login,
        logout,
        isLoading,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---
// Simplifies using the context in other components
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // Error if useAuth is used outside of an AuthProvider
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};