// components/Projects/OnboardingPrompt.jsx
import { useState } from "react";
import { useTeamMember } from "../../services/project_service";

const PRIMARY_BLUE = "#2C76BA";

/**
 * Shown instead of the Projects grid when the current user has no
 * TeamMember profile yet (backend returns 404 from GET /team-members/me).
 *
 * Onboarding is intentionally explicit, not automatic — hourly_rate and
 * github_username are meaningful fields someone should set on purpose,
 * not silently default to on first page visit.
 */
export default function OnboardingPrompt() {
  const { onboard } = useTeamMember();
  const [hourlyRate, setHourlyRate] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  const handleSubmit = () => {
    onboard.mutate({
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0,
      github_username: githubUsername.trim() || null,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4"
        style={{ backgroundColor: PRIMARY_BLUE }}
      >
        🚀
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Set up your tracker profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        One quick step before you can create or join projects.
      </p>

      <div className="space-y-4 text-left">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Hourly rate (optional)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Used to calculate labour cost on time logs. Leave blank if you don't bill by the hour.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            GitHub username (optional)
          </label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="e.g. octocat"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Lets commits you push get matched to your name automatically.
          </p>
        </div>

        {onboard.isError && (
          <p className="text-xs text-red-500">{onboard.error.message}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={onboard.isPending}
        className="w-full mt-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
        style={{ backgroundColor: PRIMARY_BLUE }}
      >
        {onboard.isPending ? "Setting up..." : "Get Started"}
      </button>
    </div>
  );
}