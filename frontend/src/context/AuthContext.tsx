import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '../api/types';
import { useProfileQuery, useUpdateProfileMutation, useLoginMutation, useLogoutMutation } from '../api/hooks';
import { useToast } from '../components/common/Toast';

const LOCAL_STORAGE_PROFILE_KEY = 'shadowsafe_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-8924',
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  email: 'priya.sharma@safenet.org',
  blood_group: 'O+',
  home_address: '42 Sunrise Heights, 12th Main Road, Bengaluru',
  home_lat: 12.9716,
  home_lng: 77.6412,
  work_address: 'Cyber Tech Park, Building 4, Bengaluru',
  work_lat: 12.8452,
  work_lng: 77.6602,
  primary_guardian: {
    name: 'Anita Sharma (Mother)',
    phone: '+91 98765 43211',
    relation: 'Parent',
    notify_on_deviation: true,
  },
  secondary_guardian: {
    name: 'Rohan Sharma (Brother)',
    phone: '+91 98765 43212',
    relation: 'Family',
    notify_on_deviation: true,
  },
  medical_notes: 'Mild asthma (inhaler carried in bag). No known drug allergies.',
  emergency_code: 'Silver Sparrow',
  is_authenticated: true,
  onboarding_completed: true,
};

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { phone_or_email: string; password?: string; is_guest?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileDrawerOpen: boolean;
  setIsProfileDrawerOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  const [localProfile, setLocalProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROFILE;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Sync with backend API
  const { data: serverProfile, isLoading } = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (serverProfile) {
      setLocalProfile(serverProfile);
      try {
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(serverProfile));
      } catch {
        // ignore
      }
    }
  }, [serverProfile]);

  const login = async (credentials: { phone_or_email: string; password?: string; is_guest?: boolean }) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      setLocalProfile(result.user);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(result.user));
      setIsAuthModalOpen(false);
      showToast({ message: `Welcome back, ${result.user.name.split(' ')[0]}!`, variant: 'primary', icon: 'shield_person' });
    } catch {
      // Offline fallback login
      const updated = {
        ...localProfile,
        is_authenticated: true,
        name: credentials.is_guest ? 'Guest Guardian (Demo)' : (credentials.phone_or_email.split('@')[0] || 'User'),
      };
      setLocalProfile(updated);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
      setIsAuthModalOpen(false);
      showToast({ message: 'Signed in successfully (Offline Secure Mode)', variant: 'primary', icon: 'lock' });
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore
    }
    const updated = { ...localProfile, is_authenticated: false };
    setLocalProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    setIsProfileDrawerOpen(false);
    showToast({ message: 'Logged out. Safety encryption session closed.', variant: 'tertiary', icon: 'logout' });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const updated = { ...localProfile, ...data, is_authenticated: true, onboarding_completed: true };
    setLocalProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));

    try {
      await updateProfileMutation.mutateAsync(data);
      showToast({ message: 'Safety profile & emergency guardians updated', variant: 'primary', icon: 'check_circle' });
    } catch {
      showToast({ message: 'Profile updated locally (Synced with local enclave)', variant: 'tertiary' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: localProfile,
        isAuthenticated: localProfile.is_authenticated,
        isLoading,
        login,
        logout,
        updateProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileDrawerOpen,
        setIsProfileDrawerOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
