// components/ProjectDetail/PlaceholderView.jsx
// Reusable empty state for tabs not yet built

export default function PlaceholderView({ title, description, icon }) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-64 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-gray-700 mb-1">{title}</h3>
        <p className="text-sm text-gray-400 max-w-xs">{description}</p>
        <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[#2C76BA] bg-blue-50 px-3 py-1.5 rounded-full">
          Coming soon
        </span>
      </div>
    );
  }