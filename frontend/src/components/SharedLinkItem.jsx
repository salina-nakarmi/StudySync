import { Link, FileText, MoreVertical } from "lucide-react";

export default function SharedLinkItem({ title, desc, author, time, type = "link" }) {
  return (
    <div className="w-full p-3 rounded-xl border border-gray-100 hover:shadow-sm transition cursor-pointer flex flex-col ">
      
      {/* Title + Icon */}
      <div className="flex items-center gap-2 font-bold text-lg">
        {type === "pdf" ? (
          <FileText size={18} className="text-red-500" />
        ) : (
          <Link size={18} className="text-red-500" />
        )}
        {title}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-1">{desc}</p>

      {/* Author + Time + Actions */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">
          Shared by <span className="font-semibold text-gray-700">{author}</span>
        </span>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{time}</span>
          <MoreVertical size={16} className="cursor-pointer hover:text-gray-700" />
        </div>
      </div>
    </div>
  );
}
