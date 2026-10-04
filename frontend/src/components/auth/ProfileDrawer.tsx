import { Icon } from '../common/Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export function ProfileDrawer() {
  const { user, isProfileDrawerOpen, setIsProfileDrawerOpen, setIsAuthModalOpen, logout } = useAuth();
  const { showToast } = useToast();

  if (!isProfileDrawerOpen) return null;

  const handleEditProfile = () => {
    setIsProfileDrawerOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleTestCall = (phone: string, name: string) => {
    showToast({
      message: `Initiating encrypted test link to ${name} (${phone})...`,
      variant: 'primary',
      icon: 'call',
    });
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-surface-container h-full p-5 sm:p-6 overflow-y-auto border-l border-outline-variant/30 shadow-2xl flex flex-col justify-between space-y-6 animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="verified_user" className="text-primary text-[22px]" />
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                Safety Profile &amp; ID
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>

          {/* Women's Safety ID Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container-low to-surface-container border border-outline-variant/30 shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(76,215,246,0.4)]">
                  {user.name.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="font-headline-sm text-base font-bold text-on-surface">
                    {user.name}
                  </h4>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    {user.phone}
                  </p>
                </div>
              </div>

              {/* Blood Group Badge */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Blood</span>
                <span className="px-2.5 py-0.5 rounded-full bg-error/20 border border-error/40 text-error font-headline-sm text-xs font-black shadow-sm">
                  {user.blood_group || 'O+'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/20 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-on-surface-variant block">Status</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  Corridor Shield Active
                </span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant block">Safe Duress Phrase</span>
                <span className="text-on-surface font-mono font-semibold">
                  "{user.emergency_code || 'Silver Sparrow'}"
                </span>
              </div>
            </div>
          </div>

          {/* Linked Guardians Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="shield" className="text-[16px]" />
                <span>Primary &amp; Emergency Guardians</span>
              </h4>
              <span className="text-[10px] text-on-surface-variant">Instant SOS link</span>
            </div>

            {/* Primary Guardian */}
            {user.primary_guardian && (
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm font-bold text-on-surface text-xs truncate">
                      {user.primary_guardian.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary text-[9px] font-bold">
                      {user.primary_guardian.relation}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-mono block">
                    {user.primary_guardian.phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestCall(user.primary_guardian.phone, user.primary_guardian.name)}
                  className="px-3 py-1.5 rounded-xl bg-secondary/20 hover:bg-secondary/30 text-secondary text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Icon name="call" className="text-[15px]" />
                  <span>Call</span>
                </button>
              </div>
            )}

            {/* Secondary Guardian */}
            {user.secondary_guardian && user.secondary_guardian.name && (
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm font-bold text-on-surface text-xs truncate">
                      {user.secondary_guardian.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[9px]">
                      {user.secondary_guardian.relation || 'Secondary'}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-mono block">
                    {user.secondary_guardian.phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestCall(user.secondary_guardian.phone, user.secondary_guardian.name)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Icon name="call" className="text-[15px]" />
                  <span>Call</span>
                </button>
              </div>
            )}
          </div>

          {/* Saved Addresses */}
          <div className="space-y-2">
            <h4 className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="home_pin" className="text-[16px]" />
              <span>Saved Safe Addresses</span>
            </h4>
            <div className="space-y-1.5 text-xs text-on-surface-variant">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                <Icon name="home" className="text-primary text-[16px] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-on-surface block text-[11px]">Home Safe Haven</span>
                  <span className="text-[10px] text-on-surface-variant line-clamp-1">{user.home_address || '42 Sunrise Heights, Indiranagar'}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                <Icon name="apartment" className="text-secondary text-[16px] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-on-surface block text-[11px]">Work / Campus Base</span>
                  <span className="text-[10px] text-on-surface-variant line-clamp-1">{user.work_address || 'Cyber Tech Park, Building 4'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Notes */}
          {user.medical_notes && (
            <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="font-label-sm text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Icon name="medical_services" className="text-[14px]" />
                Emergency Medical Notes
              </span>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {user.medical_notes}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={handleEditProfile}
            className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface font-label-md font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Icon name="edit" className="text-[18px]" />
            <span>Update Profile &amp; Guardians</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 rounded-xl bg-error-container/40 hover:bg-error-container text-on-error-container font-label-md font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-error/30 transition-all cursor-pointer"
          >
            <Icon name="logout" className="text-[18px] text-error" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
