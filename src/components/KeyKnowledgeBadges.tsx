import React from 'react';

interface KeyKnowledgeBadgesProps {
  knowledge: string | undefined;
}

export const KeyKnowledgeBadges: React.FC<KeyKnowledgeBadgesProps> = ({ knowledge }) => {
  if (!knowledge) return <span className="text-slate-400 italic">Sin conocimientos registrados</span>;

  let skills: string[] = [];
  try {
    // Try to parse as JSON array
    if (knowledge.startsWith('[') && knowledge.endsWith(']')) {
      skills = JSON.parse(knowledge);
    } else {
      // Fallback to comma-separated
      skills = knowledge.split(',').map(s => s.trim());
    }
  } catch (e) {
    // Final fallback
    skills = knowledge.split(',').map(s => s.trim());
  }

  const validSkills = skills.filter(s => s && s.length > 0);
  if (validSkills.length === 0) return <span className="text-slate-400 italic">Sin conocimientos registrados</span>;

  const badgeStyles = [
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-indigo-50 text-indigo-700 border-indigo-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-purple-50 text-purple-700 border-purple-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-cyan-50 text-cyan-700 border-cyan-100',
  ];

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {validSkills.map((skill, index) => (
        <span 
          key={index} 
          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border shadow-sm transition-colors ${badgeStyles[index % badgeStyles.length]}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
};
