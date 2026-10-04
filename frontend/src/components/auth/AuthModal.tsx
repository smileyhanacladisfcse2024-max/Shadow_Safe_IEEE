import { useState } from 'react';
import { Icon } from '../common/Icon';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export function AuthModal() {
  const { user, isAuthModalOpen, setIsAuthModalOpen, login, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'onboarding'>('signin');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding Form State
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user.blood_group || 'O+');
  const [homeAddress, setHomeAddress] = useState(user.home_address || '');
  const [workAddress, setWorkAddress] = useState(user.work_address || '');
  const [primaryGuardianName, setPrimaryGuardianName] = useState(user.primary_guardian?.name || '');
  const [primaryGuardianPhone, setPrimaryGuardianPhone] = useState(user.primary_guardian?.phone || '');
  const [primaryGuardianRelation, setPrimaryGuardianRelation] = useState(user.primary_guardian?.relation || 'Parent');
  const [secondaryGuardianName, setSecondaryGuardianName] = useState(user.secondary_guardian?.name || '');
  const [secondaryGuardianPhone, setSecondaryGuardianPhone] = useState(user.secondary_guardian?.phone || '');
  const [medicalNotes, setMedicalNotes] = useState(user.medical_notes || '');
  const [emergencyCode, setEmergencyCode] = useState(user.emergency_code || 'Silver Sparrow');

  if (!isAuthModalOpen) return null;

  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    try {
      await login({ phone_or_email: 'priya.sharma@safenet.org', is_guest: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await login({ phone_or_email: phoneOrEmail.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim() || 'Safety User',
        phone: phone.trim() || '+91 98765 43210',
        blood_group: bloodGroup,
        home_address: homeAddress.trim() || 'Indiranagar 100ft Rd',
        work_address: workAddress.trim() || 'Electronic City Phase 1',
        primary_guardian: {
          name: primaryGuardianName.trim() || 'Emergency Guardian',
          phone: primaryGuardianPhone.trim() || '+91 98765 43211',
          relation: primaryGuardianRelation,
          notify_on_deviation: true,
        },
        secondary_guardian: {
          name: secondaryGuardianName.trim() || 'Secondary Contact',
          phone: secondaryGuardianPhone.trim() || '+91 98765 43212',
          relation: 'Family',
          notify_on_deviation: true,
        },
        medical_notes: medicalNotes.trim(),
        emergency_code: emergencyCode.trim(),
      });
      setIsAuthModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-surface-container rounded-3xl p-5 sm:p-7 border border-outline-variant/30 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto shrink-0" />
            <div>
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                Women's Personal Safety Hub
              </h2>
              <p className="font-label-sm text-[11px] text-on-surface-variant">
                Zero-Knowledge Identity &amp; Guardian Network
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`py-2 rounded-lg font-label-md text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'signin'
                ? 'bg-surface-container-high text-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In / Quick Access
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onboarding')}
            className={`py-2 rounded-lg font-label-md text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'onboarding'
                ? 'bg-surface-container-high text-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Safety Onboarding
          </button>
        </div>

        {/* Tab 1: Sign In */}
        {activeTab === 'signin' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
              <Icon name="verified_user" className="text-primary text-[24px] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-label-md font-bold text-primary text-xs">
                  Autonomous Protection Ready
                </h4>
                <p className="font-body-sm text-on-surface-variant text-[11px] leading-relaxed">
                  Sign in to link your real emergency contacts, blood group, medical identifiers, and live autonomous safe corridor rerouting.
                </p>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant block mb-1.5 font-medium">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <Icon name="phone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                  <input
                    type="text"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="+91 98765 43210 or user@email.com"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !phoneOrEmail.trim()}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-md font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In with Secure OTP'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-outline-variant/30 w-full" />
              <span className="bg-surface-container px-3 text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                OR Instant Demo
              </span>
            </div>

            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface font-label-md font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Icon name="rocket_launch" className="text-secondary text-[18px]" />
              <span>One-Tap Demo: Continue as Priya Sharma (O+)</span>
            </button>
          </div>
        )}

        {/* Tab 2: Onboarding & Profile Setup */}
        {activeTab === 'onboarding' && (
          <form onSubmit={handleOnboardingSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. Personal Identity */}
            <div className="space-y-3">
              <h4 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="badge" className="text-[16px]" />
                <span>1. Personal &amp; Medical Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1">
                    Emergency Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Blood Group Selector */}
              <div>
                <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1.5">
                  Blood Group (Crucial for Emergency Care) *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        bloodGroup === bg
                          ? 'bg-error text-on-error shadow-[0_0_10px_rgba(239,68,68,0.5)] scale-105'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Guardian Emergency Contacts */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/20">
              <h4 className="font-label-md text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="shield" className="text-[16px]" />
                <span>2. Emergency Guardians</span>
              </h4>

              {/* Primary Guardian */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <span className="font-label-sm text-[11px] font-bold text-on-surface flex items-center gap-1">
                  <Icon name="star" className="text-secondary text-[14px]" />
                  Primary Guardian (First Escalation &amp; SMS)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={primaryGuardianName}
                    onChange={(e) => setPrimaryGuardianName(e.target.value)}
                    placeholder="Name (e.g. Anita Sharma)"
                    className="sm:col-span-1 bg-surface-container border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-xs text-on-surface"
                  />
                  <input
                    type="tel"
                    required
                    value={primaryGuardianPhone}
                    onChange={(e) => setPrimaryGuardianPhone(e.target.value)}
                    placeholder="Phone (+91...)"
                    className="sm:col-span-1 bg-surface-container border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-xs text-on-surface"
                  />
                  <select
                    value={primaryGuardianRelation}
                    onChange={(e) => setPrimaryGuardianRelation(e.target.value)}
                    className="sm:col-span-1 bg-surface-container border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-xs text-on-surface"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse / Partner</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Close Friend</option>
                  </select>
                </div>
              </div>

              {/* Secondary Guardian */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                  <Icon name="person" className="text-[14px]" />
                  Secondary Guardian (Backup Alert)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={secondaryGuardianName}
                    onChange={(e) => setSecondaryGuardianName(e.target.value)}
                    placeholder="Name (e.g. Rohan Sharma)"
                    className="bg-surface-container border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-xs text-on-surface"
                  />
                  <input
                    type="tel"
                    value={secondaryGuardianPhone}
                    onChange={(e) => setSecondaryGuardianPhone(e.target.value)}
                    placeholder="Phone (+91...)"
                    className="bg-surface-container border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-xs text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* 3. Safe Base Locations */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/20">
              <h4 className="font-label-md text-xs font-bold text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="home_pin" className="text-[16px]" />
                <span>3. Saved Safe Addresses</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1">
                    Home Safe Haven Address
                  </label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="42 Sunrise Heights, Indiranagar"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1">
                    Work / College Location
                  </label>
                  <input
                    type="text"
                    value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)}
                    placeholder="Cyber Tech Park, Building 4"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* 4. Medical Notes & Emergency Duress Phrase */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1">
                    Medical Notes / Allergies (Encrypted)
                  </label>
                  <input
                    type="text"
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Asthma, diabetic, allergies..."
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1">
                    Duress Safe Phrase (Silent Check-In)
                  </label>
                  <input
                    type="text"
                    value={emergencyCode}
                    onChange={(e) => setEmergencyCode(e.target.value)}
                    placeholder="Secret safe code word"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-md font-bold text-sm shadow-lg transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? 'Saving Safety Profile...' : 'Complete Onboarding & Protect Corridor'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
