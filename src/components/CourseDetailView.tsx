import React, { useState, useEffect } from 'react';
import { CourseMaterial, PageView } from '../types';
import { COURSES } from '../data/coursesData';
import {
  ArrowLeft,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Printer,
  Sparkles,
  GraduationCap,
  FileText,
  Search,
  ExternalLink
} from 'lucide-react';

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
  onNavigateCourse: (page: PageView) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseId,
  onBack,
  onNavigateCourse,
}) => {
  const course = COURSES.find((c) => c.id === courseId) || COURSES[0];

  const [activeTab, setActiveTab] = useState<'text' | 'vocabulary' | 'syllabus'>('text');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Audio timer simulation for Karaoke highlighting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentAudioTime((prev) => {
          const next = prev + 0.5;
          if (next > 42) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Sync karaoke line with current playback time
  useEffect(() => {
    if (course.poemLines) {
      const matched = course.poemLines.find(
        (l) => currentAudioTime >= l.start && currentAudioTime < l.end
      );
      setActiveLineId(matched ? matched.id : null);
    }
  }, [currentAudioTime, course.poemLines]);

  const handleLineClick = (startSec: number) => {
    setCurrentAudioTime(startSec);
    setIsPlaying(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 md:px-6 pt-28 pb-20 max-w-5xl">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition font-medium border border-gray-700"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to All Courses</span>
        </button>

        {/* Quick Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-800/80 p-1 rounded-xl border border-gray-700/80 overflow-x-auto">
          {COURSES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onNavigateCourse(c.id as PageView);
                setCurrentAudioTime(0);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                c.id === course.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {/* Course Hero Banner */}
      <div className="bg-gradient-to-r from-gray-800/90 via-gray-800/60 to-gray-800/90 border border-gray-700 rounded-2xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{course.semester}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2">
              <span className="text-emerald-400">{course.code}:</span> {course.title}
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            {course.downloadUrl && (
              <a
                href={course.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Study Materials</span>
              </a>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-gray-700/70 hover:bg-gray-700 text-gray-200 text-xs md:text-sm font-medium rounded-xl flex items-center justify-center gap-2 border border-gray-600 transition"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print / Export Notes</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-gray-700/60">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'text'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-300 bg-gray-900/60 hover:bg-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Poetry & Line Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'vocabulary'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-300 bg-gray-900/60 hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Terminology & Vocabulary</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'syllabus'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-300 bg-gray-900/60 hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Full Syllabus Breakdown</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          {/* Audio Karaoke Bar for Poetry */}
          {course.poemLines && (
            <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 transition shrink-0"
                  title={isPlaying ? 'Pause Recitation' : 'Play Recitation'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    {isPlaying ? 'Recitation Playing (Auto-karaoke synced)' : 'Listen to Native Recitation'}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Click any table row below to jump audio to that specific verse.
                  </div>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-3 w-full sm:w-64">
                <span className="text-xs font-mono text-gray-300">
                  {Math.floor(currentAudioTime / 60)}:
                  {String(Math.floor(currentAudioTime % 60)).padStart(2, '0')}
                </span>
                <input
                  type="range"
                  min="0"
                  max="42"
                  step="0.5"
                  value={currentAudioTime}
                  onChange={(e) => setCurrentAudioTime(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-xs font-mono text-gray-400">0:42</span>
              </div>
            </div>
          )}

          {/* Authentic Document-Styled Poem Viewer Page */}
          <div className="poem-page shadow-2xl">
            <div className="watermark">CLASS CADDY DU</div>

            <div className="poem-page-content-wrapper">
              <h2 className="poem-title font-serif">
                {course.code === 'Course-405'
                  ? 'مُعَلَّقَةُ النَّابِغَةِ الذُّبْيَانِيِّ (يَا دَارَ مَيَّةَ)'
                  : `${course.title} - Academic Text`}
              </h2>
              <div className="text-center text-xs text-gray-600 mb-4 font-sans">
                Department of Arabic, University of Dhaka • 8th Semester Study Guide
              </div>

              <div className="section-title">Word-by-Word & Line-by-Line Analytical Translation</div>

              {course.poemLines && course.poemLines.length > 0 ? (
                <div className="overflow-x-auto my-2">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45%' }}>النص العربي (Arabic Verse)</th>
                        <th style={{ width: '35%' }}>বাংলা অনুবাদ (Bangla Meaning)</th>
                        <th style={{ width: '20%' }}>English Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.poemLines.map((line, idx) => {
                        const isLineActive = activeLineId === line.id;
                        return (
                          <tr
                            key={line.id}
                            id={line.id}
                            onClick={() => handleLineClick(line.start)}
                            className={`cursor-pointer transition-all ${
                              isLineActive ? 'highlight' : ''
                            }`}
                            title="Click to play audio from this line"
                          >
                            <td className="arabic-cell font-serif">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs text-gray-400 font-sans mt-1">
                                  [{idx + 1}]
                                </span>
                                <span className="text-right leading-loose font-medium">{line.arabic}</span>
                              </div>
                            </td>
                            <td className="bangla text-sm">
                              {line.bangla}
                            </td>
                            <td className="text-xs text-gray-600 font-sans italic">
                              {line.english}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-600">
                  <p className="text-sm">
                    Detailed text annotations for {course.title} are compiled in the downloadable notes package.
                  </p>
                </div>
              )}

              {/* Footnote / Page Number */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-sans">
                <span>Class Caddy • Academic Study System</span>
                <span>Page 1 of 1</span>
                <span>Verified Curriculum</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vocabulary Tab */}
      {activeTab === 'vocabulary' && (
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Lexicon & Terminology Bank</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Key terms, Arabic roots, and accurate Bangla/English glossaries
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search vocabulary..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {course.vocabulary && course.vocabulary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-900/80 text-xs uppercase font-semibold text-emerald-400 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-right">الكلمة (Arabic)</th>
                    <th className="px-4 py-3">Transliteration</th>
                    <th className="px-4 py-3">বাংলা অর্থ (Bangla)</th>
                    <th className="px-4 py-3">English Translation</th>
                    <th className="px-4 py-3">Root (الجذر)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60">
                  {course.vocabulary
                    .filter(
                      (v) =>
                        v.arabic.includes(searchFilter) ||
                        v.bangla.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        v.english.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        v.transliteration.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 font-serif text-lg text-right text-emerald-300 font-bold">
                          {item.arabic}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-300">
                          {item.transliteration}
                        </td>
                        <td className="px-4 py-3 font-bangla text-sm text-gray-200">
                          {item.bangla}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-300">
                          {item.english}
                        </td>
                        <td className="px-4 py-3 text-xs font-serif text-emerald-400">
                          {item.rootWord || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No vocabulary list available for this course.</p>
          )}
        </div>
      )}

      {/* Syllabus Tab */}
      {activeTab === 'syllabus' && (
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Detailed Syllabus Topics</h3>
            <p className="text-xs text-gray-400">
              Approved syllabus for 8th Semester B.A. (Hons.) / M.A. Department of Arabic, University of Dhaka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.topics.map((topic, i) => (
              <div
                key={i}
                className="p-4 bg-gray-900/60 border border-gray-700/70 rounded-xl flex items-start gap-3 hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-200">{topic}</div>
                  <div className="text-xs text-gray-500 mt-1">Course module unit {i + 1}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reference Reading Books */}
          <div className="pt-6 border-t border-gray-700">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">
              Recommended Reference Bibliography
            </h4>
            <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
              <li>Shawqi Dayf — <span className="italic">Tarikh al-Adab al-Arabi: Al-Asr al-Hadith</span></li>
              <li>Dr. Taha Husayn — <span className="italic">Fi al-Shi‘r al-Jahili wa Ruwwad al-Nahdah</span></li>
              <li>Department of Arabic, DU — <span className="italic">Compilation of 8th Semester Lecture Monograph</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
