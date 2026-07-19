// components/ProjectDetail/AssigneeSelect.jsx
import { useProjectMembers } from "../../services/project_service";

function displayName(member) {
  const full = [member.first_name, member.last_name].filter(Boolean).join(" ");
  return full || member.username;
}

export default function AssigneeSelect({ projectId, value, onChange }) {
  const { members, isLoading } = useProjectMembers(projectId);

  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
        Assignee
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {(members || []).map((member) => (
          <option key={member.member_id} value={member.member_id}>
            {displayName(member)}
          </option>
        ))}
      </select>
    </div>
  );
}