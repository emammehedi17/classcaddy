import React from 'react';
import { PageView } from '../types';
import { COURSES, PREVIOUS_QUESTIONS } from '../data/coursesData';
import { BookOpen, ExternalLink, ArrowUpRight, GraduationCap, Sparkles } from 'lucide-react';

interface AcademicCoursesGridProps {
  onSelectCourse: (page: PageView) => void;
}

export const AcademicCoursesGrid: React.FC<AcademicCoursesGridProps> = ({ onSelectCourse }) => {
  return (
    <section id="academic-courses" className="container mx-auto px-4 md:px-6 py-20">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <GraduationCap className="w-4 h-4" />
          <span>Department of Arabic, DU</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">
          Academic Courses
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          8th Semester • Syllabus, Analysis, Vocabulary & Past Papers
        </p>
      </div>

      {/* Grid of 6 Course & Question Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Course 405 */}
        <button
          onClick={() => onSelectCourse('course-405')}
          className="group course-button-glow flex flex-col items-center justify-between p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl min-h-[220px] hover:border-emerald-500 hover:bg-gray-800/90 transition-all text-left w-full shadow-lg"
        >
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>

          <div className="w-full flex items-center justify-between relative z-10 mb-3">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span>Interactive</span>
              <Sparkles className="w-3 h-3" />
            </span>
          </div>

          <div className="relative z-10 w-full">
            <div className="font-bold text-base md:text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">
              Course-405
            </div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              Modern Poetry II (Al-Shi‘r al-Hadith)
            </div>
          </div>

          <div className="w-full relative z-10 mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Read Poem & Notes</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* Course 406 */}
        <button
          onClick={() => onSelectCourse('course-406')}
          className="group course-button-glow flex flex-col items-center justify-between p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl min-h-[220px] hover:border-emerald-500 hover:bg-gray-800/90 transition-all text-left w-full shadow-lg"
        >
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>

          <div className="w-full flex items-center justify-between relative z-10 mb-3">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-900/60 border border-gray-700 px-2.5 py-1 rounded-full">
              Trilingual
            </span>
          </div>

          <div className="relative z-10 w-full">
            <div className="font-bold text-base md:text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">
              Course-406
            </div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              Terminology through Translation (At-Tarjamah)
            </div>
          </div>

          <div className="w-full relative z-10 mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>View Terminology Bank</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* Course 407 */}
        <button
          onClick={() => onSelectCourse('course-407')}
          className="group course-button-glow flex flex-col items-center justify-between p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl min-h-[220px] hover:border-emerald-500 hover:bg-gray-800/90 transition-all text-left w-full shadow-lg"
        >
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>

          <div className="w-full flex items-center justify-between relative z-10 mb-3">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-900/60 border border-gray-700 px-2.5 py-1 rounded-full">
              Theory
            </span>
          </div>

          <div className="relative z-10 w-full">
            <div className="font-bold text-base md:text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">
              Course-407
            </div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              Arabic Literary Criticism (Naqd al-Adab)
            </div>
          </div>

          <div className="w-full relative z-10 mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Critical Schools & Summary</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* Course 408 */}
        <button
          onClick={() => onSelectCourse('course-408')}
          className="group course-button-glow flex flex-col items-center justify-between p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl min-h-[220px] hover:border-emerald-500 hover:bg-gray-800/90 transition-all text-left w-full shadow-lg"
        >
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>

          <div className="w-full flex items-center justify-between relative z-10 mb-3">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-900/60 border border-gray-700 px-2.5 py-1 rounded-full">
              Methodology
            </span>
          </div>

          <div className="relative z-10 w-full">
            <div className="font-bold text-base md:text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">
              Course-408 (B)
            </div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              Social Research and Project (Manhaj al-Baḥth)
            </div>
          </div>

          <div className="w-full relative z-10 mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Research Guidelines</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* Pre. Ques. 2017-21 */}
        <a
          href="https://drive.google.com/file/d/1I9fn2ROCa7a-jrNZ9U0KXK8jKznh378D/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="group course-button-glow flex flex-col items-center justify-between p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl min-h-[220px] hover:border-emerald-500 hover:bg-gray-800/90 transition-all text-left w-full shadow-lg"
        >
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>

          <div className="w-full flex items-center justify-between relative z-10 mb-3">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              PDF Archive
            </span>
          </div>

          <div className="relative z-10 w-full">
            <div className="font-bold text-base md:text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">
              Pre. Ques. (2017–21)
            </div>
            <div className="text-xs text-gray-400 mt-1">
              8th Semester Complete Question Collection
            </div>
          </div>

          <div className="w-full relative z-10 mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Download Drive PDF</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
        </a>

        {/* Pre. Ques. 2021-23 */}
        <a
          href="https://drive.google.com/file/d/1A6asIfVsu2LiVqg0lozhS075gF-GvT_-/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="group course-button-glow flex flex-col items-center justify-between p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl min-h-[220px] hover:border-emerald-500 hover:bg-gray-800/90 transition-all text-left w-full shadow-lg"
        >
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>
          <span className="glow"></span>

          <div className="w-full flex items-center justify-between relative z-10 mb-3">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              PDF Archive
            </span>
          </div>

          <div className="relative z-10 w-full">
            <div className="font-bold text-base md:text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">
              Pre. Ques. (2021–23)
            </div>
            <div className="text-xs text-gray-400 mt-1">
              8th Semester Recent Examination Papers
            </div>
          </div>

          <div className="w-full relative z-10 mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Download Drive PDF</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
        </a>
      </div>
    </section>
  );
};
