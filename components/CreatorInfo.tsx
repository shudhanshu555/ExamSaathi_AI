
import React from 'react';
import { User, GraduationCap, School, Code } from 'lucide-react';

const CreatorInfo: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Code size={18} />
            </div>
            <span className="text-xl font-bold">ExamSaathi</span>
          </div>
          <p className="text-slate-500 text-sm">Empowering students through AI-driven education.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex items-center gap-3">
            <User size={18} className="text-blue-500" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Developer</p>
              <p className="text-sm font-bold">Shudhanshu Kumar Yadav</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap size={18} className="text-blue-500" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Education</p>
              <p className="text-sm font-bold">1st-year B.Tech Student</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <School size={18} className="text-blue-500" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">College</p>
              <p className="text-sm font-bold">Academy of Technology</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
              <p className="text-sm font-bold">Project Creator</p>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-12 text-slate-400 text-xs">
        © 2024 ExamSaathi. Created with ❤️ for students.
      </div>
    </footer>
  );
};

export default CreatorInfo;
