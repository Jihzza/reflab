import UsernameSettings from "./UsernameSettings";
import PasswordSettings from "./PasswordSettings";
import DeleteAccountSettings from "./DeleteAccountSettings";

/**
 * SettingsPage - Account settings container
 *
 * Features:
 * - Page heading
 * - UsernameSettings component
 * - PasswordSettings component
 * - DeleteAccountSettings component (Phase 7)
 */
export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

      <div className="space-y-6">
        {/* Username Settings */}
        <UsernameSettings />

        {/* Password Settings */}
        <PasswordSettings />

        {/* Delete Account Settings */}
        <DeleteAccountSettings />
      </div>
    </div>
  );
}
