import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArchiveCardButton, ThemeMode } from '../types';
import {
  Folder,
  FileText,
  Globe,
  Upload,
  ExternalLink,
  Eye,
  Trash2,
  Edit3,
  Copy,
  Scissors,
  Clipboard,
  Plus,
  FolderPlus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Grid,
  List,
  AlignJustify,
  FileCode,
  FileType,
  Sparkles,
  Layers,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  Compass,
  CornerDownRight,
  MoreVertical,
  Maximize2,
  Download,
  Info,
  ChevronRight,
  ChevronDown,
  Home,
  RefreshCw,
  HardDrive,
  Check,
  X,
  File,
  Minus,
  Square,
  Minimize2,
  Columns3,
  Files,
} from 'lucide-react';

export type ExplorerLayout = 'large-icons' | 'medium-icons' | 'small-icons' | 'list' | 'details' | 'tiles';
export type SortField = 'title' | 'type' | 'size' | 'date';
export type SortOrder = 'asc' | 'desc';

interface Windows11ExplorerProps {
  cards: ArchiveCardButton[];
  rootCards: ArchiveCardButton[];
  folderPath: string[];
  isDark: boolean;
  isAdmin: boolean;
  isCloudSyncing?: boolean;
  onNavigateFolder: (path: string[]) => void;
  onNavigateBack: () => void;
  onCardClick: (card: ArchiveCardButton) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (card: ArchiveCardButton) => void;
  onDeleteCard: (id: string) => void;
  onSaveCurrentCards: (updated: ArchiveCardButton[]) => void;
  onOpenUpload: () => void;
  onOpenMultiUpload?: () => void;
  onCloseExplorer: () => void;
}

export const Windows11Explorer: React.FC<Windows11ExplorerProps> = ({
  cards,
  rootCards,
  folderPath,
  isDark,
  isAdmin,
  isCloudSyncing = false,
  onNavigateFolder,
  onNavigateBack,
  onCardClick,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteCard,
  onSaveCurrentCards,
  onOpenUpload,
  onOpenMultiUpload,
  onCloseExplorer,
}) => {
  // View mode and sorting state
  const [layout, setLayout] = useState<ExplorerLayout>(() => {
    return (localStorage.getItem('w11_explorer_layout') as ExplorerLayout) || 'medium-icons';
  });
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clipboardItem, setClipboardItem] = useState<{ card: ArchiveCardButton; op: 'copy' | 'cut' } | null>(null);

  // Quick Rename inline
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; card?: ArchiveCardButton } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // In-app Delete Confirmation Modal (avoids iframe blocking window.confirm)
  const [cardPendingDelete, setCardPendingDelete] = useState<ArchiveCardButton | null>(null);

  // Fullscreen toggle state for the window
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    try {
      const docEl = document.documentElement as any;
      const isDocFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;

      if (!isDocFullscreen) {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (req) {
          req.call(docEl).catch((err: any) => {
            console.warn('Native requestFullscreen notice (non-fatal, app uses CSS fixed full-screen layout):', err);
          });
        }
        setIsFullscreen(true);
      } else {
        const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
        if (exit) {
          exit.call(document).catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = Boolean(
        document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
      );
      setIsFullscreen(isDocFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Save layout preference
  useEffect(() => {
    localStorage.setItem('w11_explorer_layout', layout);
  }, [layout]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard shortcut: Delete key when item is selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAdmin || renamingId || cardPendingDelete) return;
      if (e.key === 'Delete') {
        if (selectedId) {
          const selCard = cards.find((c) => c.id === selectedId);
          if (selCard) {
            e.preventDefault();
            setCardPendingDelete(selCard);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, selectedId, cards, renamingId, cardPendingDelete]);

  // Request item deletion with modal
  const handleRequestDelete = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setCardPendingDelete(card);
    } else {
      onDeleteCard(cardId);
      setSelectedId(null);
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (cardPendingDelete) {
      onDeleteCard(cardPendingDelete.id);
      setSelectedId(null);
      setCardPendingDelete(null);
    }
  };

  // Filter & Sort
  const processedCards = useMemo(() => {
    let list = [...cards];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.fileName?.toLowerCase().includes(q) ||
          c.badgeText?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      // Always put folders first like Windows File Explorer
      const isAFolder = a.targetType === 'folder';
      const isBFolder = b.targetType === 'folder';
      if (isAFolder && !isBFolder) return -1;
      if (!isAFolder && isBFolder) return 1;

      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortField === 'type') {
        valA = a.targetType || 'url';
        valB = b.targetType || 'url';
      } else if (sortField === 'size') {
        valA = a.fileData?.length || a.htmlContent?.length || 0;
        valB = b.fileData?.length || b.htmlContent?.length || 0;
      } else if (sortField === 'date') {
        valA = a.createdAt || 0;
        valB = b.createdAt || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [cards, searchQuery, sortField, sortOrder]);

  // Breadcrumb path list
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string; title: string; path: string[] }[] = [];
    let curList = rootCards;
    const pathAcc: string[] = [];

    for (const folderId of folderPath) {
      const found = curList.find((c) => c.id === folderId);
      if (found) {
        pathAcc.push(found.id);
        crumbs.push({ id: found.id, title: found.title, path: [...pathAcc] });
        curList = found.children || [];
      }
    }
    return crumbs;
  }, [rootCards, folderPath]);

  // Current folder name
  const currentFolderName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].title : 'This PC > Archives';

  // Format File Size Helper
  const getFileSizeString = (card: ArchiveCardButton) => {
    if (card.targetType === 'folder') {
      const count = card.children?.length || 0;
      return `${count} ${count === 1 ? 'item' : 'items'}`;
    }
    const len = card.fileData?.length || card.htmlContent?.length;
    if (!len) return '--';
    const kb = len / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // Get Type Description Helper
  const getItemTypeString = (card: ArchiveCardButton) => {
    if (card.targetType === 'folder') return 'File folder';
    if (card.targetType === 'html') return 'HTML Document';
    if (card.targetType === 'file') {
      if (card.fileType?.includes('pdf') || card.fileName?.endsWith('.pdf')) return 'PDF Document';
      if (card.fileType?.includes('image') || card.fileName?.match(/\.(png|jpg|jpeg|svg|webp)$/i)) return 'Image File';
      if (card.fileType?.includes('word') || card.fileName?.match(/\.(doc|docx)$/i)) return 'Word Document';
      if (card.fileType?.includes('sheet') || card.fileName?.match(/\.(xls|xlsx)$/i)) return 'Excel Spreadsheet';
      if (card.fileType?.includes('zip') || card.fileName?.endsWith('.zip')) return 'Compressed Archive';
      return card.fileType || 'Generic File';
    }
    return 'Internet Shortcut';
  };

  // Admin Actions: Rename
  const handleStartRename = (card: ArchiveCardButton) => {
    setRenamingId(card.id);
    setRenameValue(card.title);
  };

  const handleApplyRename = () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const updated = cards.map((c) => (c.id === renamingId ? { ...c, title: renameValue.trim() } : c));
    onSaveCurrentCards(updated);
    setRenamingId(null);
  };

  // Admin Actions: Copy / Cut / Paste
  const handleCopy = (card: ArchiveCardButton) => {
    setClipboardItem({ card, op: 'copy' });
  };

  const handleCut = (card: ArchiveCardButton) => {
    setClipboardItem({ card, op: 'cut' });
  };

  const handlePaste = () => {
    if (!clipboardItem) return;
    const { card, op } = clipboardItem;

    if (op === 'copy') {
      const newCopy: ArchiveCardButton = {
        ...card,
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: `${card.title} (Copy)`,
        createdAt: Date.now(),
      };
      onSaveCurrentCards([...cards, newCopy]);
    } else if (op === 'cut') {
      // Check if already in current list
      const exists = cards.some((c) => c.id === card.id);
      if (!exists) {
        onSaveCurrentCards([...cards, card]);
      }
      setClipboardItem(null);
    }
  };

  // Admin: Create New Folder quickly
  const handleNewFolder = () => {
    const newFolder: ArchiveCardButton = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: 'New Folder',
      subtitle: 'Folder created in File Explorer',
      targetType: 'folder',
      children: [],
      iconName: 'Folder',
      colorTheme: 'amber',
      badgeText: 'Folder',
      createdAt: Date.now(),
    };
    const updated = [...cards, newFolder];
    onSaveCurrentCards(updated);
    // Automatically trigger rename on the new folder
    setTimeout(() => {
      setRenamingId(newFolder.id);
      setRenameValue('New Folder');
    }, 50);
  };

  // Admin: Move Up / Move Down
  const handleMoveOrder = (id: string, dir: 'up' | 'down') => {
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cards.length) return;
    const newCards = [...cards];
    const temp = newCards[idx];
    newCards[idx] = newCards[targetIdx];
    newCards[targetIdx] = temp;
    onSaveCurrentCards(newCards);
  };

  // Render Icon according to card type
  const renderItemIcon = (card: ArchiveCardButton, size: 'sm' | 'md' | 'lg') => {
    const isFolder = card.targetType === 'folder';
    const isHtml = card.targetType === 'html' || card.fileName?.endsWith('.html') || card.fileName?.endsWith('.htm');
    const isPdf = card.fileType?.includes('pdf') || card.fileName?.endsWith('.pdf');
    const isUrl = card.targetType === 'url';

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-14 h-14',
    };

    if (isFolder) {
      return (
        <div className="relative flex items-center justify-center">
          <Folder
            className={`${sizeClasses[size]} text-amber-500 fill-amber-400 drop-shadow-sm transition-transform group-hover:scale-105`}
          />
        </div>
      );
    }
    if (isHtml) {
      return (
        <div className="relative flex items-center justify-center">
          <FileCode
            className={`${sizeClasses[size]} text-emerald-500 fill-emerald-100/50 drop-shadow-sm transition-transform group-hover:scale-105`}
          />
        </div>
      );
    }
    if (isPdf) {
      return (
        <div className="relative flex items-center justify-center">
          <FileText
            className={`${sizeClasses[size]} text-rose-500 fill-rose-100/50 drop-shadow-sm transition-transform group-hover:scale-105`}
          />
        </div>
      );
    }
    if (isUrl) {
      return (
        <div className="relative flex items-center justify-center">
          <Globe
            className={`${sizeClasses[size]} text-blue-500 fill-blue-100/50 drop-shadow-sm transition-transform group-hover:scale-105`}
          />
          <ExternalLink className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-blue-700 bg-white rounded-full p-0.5" />
        </div>
      );
    }
    return (
      <div className="relative flex items-center justify-center">
        <File
          className={`${sizeClasses[size]} text-indigo-500 fill-indigo-100/50 drop-shadow-sm transition-transform group-hover:scale-105`}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id="windows-11-file-explorer"
      className={`w-full h-full flex flex-col overflow-hidden select-none font-sans transition-colors duration-150 ${
        isDark
          ? 'bg-gray-900 text-gray-100'
          : 'bg-[#f3f3f3] text-slate-800'
      }`}
      onContextMenu={(e) => {
        if (isAdmin) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }
      }}
    >
      {/* 🪟 Windows 11 Native Acrylic Title Bar with Tabs & Window Controls */}
      <div
        className={`h-10 px-2 flex items-center justify-between border-b select-none shrink-0 ${
          isDark
            ? 'bg-gray-950 border-gray-800 text-gray-300'
            : 'bg-[#e5e5e5] border-[#d4d4d4] text-slate-700'
        }`}
      >
        {/* Left Side: Active Explorer Tab */}
        <div className="flex items-center gap-1.5 h-full pt-1.5 overflow-hidden">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x text-xs font-medium shadow-sm transition max-w-xs truncate ${
              isDark
                ? 'bg-gray-900 border-gray-800 text-white'
                : 'bg-white border-[#d4d4d4] text-slate-900'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{currentFolderName}</span>
            <button
              onClick={onCloseExplorer}
              className="p-0.5 ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-200"
              title="Close Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handleNewFolder}
            className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition`}
            title="Open New Tab / Folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Title Bar Branding */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
          <span>File Explorer</span>
          <span>•</span>
          <span className="text-[11px] font-normal">{isAdmin ? 'Administrator Mode' : 'User View'}</span>
        </div>

        {/* Right Side: Windows 11 Native Window Controls (Minimize, Maximize/Restore, Close X) */}
        <div className="flex items-center h-full">
          {/* Minimize Button */}
          <button
            onClick={onCloseExplorer}
            className={`h-full w-11 flex items-center justify-center transition ${
              isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Minimize / Exit File Explorer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore Button */}
          <button
            onClick={toggleFullscreen}
            className={`h-full w-11 flex items-center justify-center transition ${
              isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title={isFullscreen ? 'Restore Down' : 'Maximize (F11 Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Square className="w-3 h-3" />}
          </button>

          {/* Windows 11 Red Close (X) Button to Exit Explorer View */}
          <button
            id="windows-11-close-btn"
            onClick={onCloseExplorer}
            className="h-full w-12 flex items-center justify-center transition bg-transparent hover:bg-[#e81123] text-gray-400 hover:text-white group"
            title="Close File Explorer (Exit to Standard View)"
          >
            <X className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      {/* 🪟 Windows 11 Fluent Command Bar */}
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-medium shrink-0 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left Toolbar: Admin Management Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          {isAdmin && (
            <>
              {/* New Dropdown / Button */}
              <button
                onClick={handleNewFolder}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition shadow-sm ${
                  isDark
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title="Create a New Sub-Folder"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>New Folder</span>
              </button>

              <button
                onClick={onOpenAddModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition shadow-sm ${
                  isDark
                    ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
                title="Add New Card / Button / Resource"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>New Item</span>
              </button>

              <button
                onClick={onOpenUpload}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition shadow-sm ${
                  isDark
                    ? 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-800/60'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                }`}
                title="Upload Single File from PC/Mobile"
              >
                <Upload className="w-4 h-4 text-blue-500" />
                <span>Upload File</span>
              </button>

              {onOpenMultiUpload && (
                <button
                  onClick={onOpenMultiUpload}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition shadow-sm ${
                    isDark
                      ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800/60'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
                  }`}
                  title="Upload Multiple Files at Once (Separate Files, Not Zipped)"
                >
                  <Files className="w-4 h-4 text-purple-500" />
                  <span>Upload Multiple Files</span>
                </button>
              )}

              <div className={`h-5 w-[1px] mx-1 ${isDark ? 'bg-gray-700' : 'bg-slate-300'}`} />

              {/* Paste action if item is on clipboard */}
              {clipboardItem && (
                <button
                  onClick={handlePaste}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border animate-pulse transition ${
                    isDark
                      ? 'bg-indigo-950/50 text-indigo-300 border-indigo-700'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  }`}
                  title={`Paste ${clipboardItem.card.title}`}
                >
                  <Clipboard className="w-4 h-4 text-indigo-500" />
                  <span>Paste</span>
                </button>
              )}

              {/* Selected Item Actions (Edit, Rename, Delete, Cut, Copy) */}
              {selectedId && (
                <>
                  {(() => {
                    const selCard = cards.find((c) => c.id === selectedId);
                    if (!selCard) return null;
                    return (
                      <div className="flex items-center gap-1 animate-in fade-in">
                        <button
                          onClick={() => handleCopy(selCard)}
                          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300`}
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCut(selCard)}
                          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300`}
                          title="Cut / Move"
                        >
                          <Scissors className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartRename(selCard)}
                          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300`}
                          title="Rename"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenEditModal(selCard)}
                          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400`}
                          title="Edit Card Properties"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(selCard.id)}
                          className={`p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500`}
                          title="Delete (Del)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>

        {/* Right Toolbar: View Mode & Sorting Dropdowns (Available for ALL users) */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] opacity-70 hidden sm:inline ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Sort:
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className={`rounded-lg px-2 py-1 text-xs border focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-200'
                  : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="title">Name</option>
              <option value="type">Type</option>
              <option value="size">Size</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`p-1.5 rounded-lg border transition ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
              title={sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className={`h-5 w-[1px] mx-1 ${isDark ? 'bg-gray-700' : 'bg-slate-300'}`} />

          {/* View Modes (Windows 11 View menu) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-slate-300 dark:border-gray-700">
            <button
              onClick={() => setLayout('large-icons')}
              className={`p-1.5 rounded-md transition ${
                layout === 'large-icons'
                  ? isDark
                    ? 'bg-gray-700 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Large icons"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('medium-icons')}
              className={`p-1.5 rounded-md transition ${
                layout === 'medium-icons'
                  ? isDark
                    ? 'bg-gray-700 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Medium icons"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('small-icons')}
              className={`p-1.5 rounded-md transition ${
                layout === 'small-icons'
                  ? isDark
                    ? 'bg-gray-700 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Small icons"
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-1.5 rounded-md transition ${
                layout === 'list'
                  ? isDark
                    ? 'bg-gray-700 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('details')}
              className={`p-1.5 rounded-md transition ${
                layout === 'details'
                  ? isDark
                    ? 'bg-gray-700 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Details table"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 Address Bar & Search Bar */}
      <div
        className={`px-3 py-2 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs ${
          isDark ? 'bg-gray-850 border-gray-800 text-gray-300' : 'bg-slate-100/70 border-slate-200 text-slate-700'
        }`}
      >
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onNavigateBack}
            disabled={folderPath.length === 0}
            className={`p-1.5 rounded-lg border transition disabled:opacity-30 ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-750 text-gray-200 border-gray-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Back to parent folder"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateFolder([])}
            className={`p-1.5 rounded-lg border transition ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-750 text-gray-200 border-gray-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Home Directory"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Breadcrumb Address Bar */}
        <div
          className={`flex-1 rounded-lg border px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs font-mono scrollbar-none ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-300'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <button
            onClick={() => onNavigateFolder([])}
            className="hover:underline text-emerald-600 dark:text-emerald-400 font-semibold shrink-0"
          >
            Archives (C:)
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <button
                onClick={() => onNavigateFolder(crumb.path)}
                className={`shrink-0 hover:underline ${
                  idx === breadcrumbs.length - 1
                    ? 'font-bold text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {crumb.title}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative sm:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${currentFolderName}...`}
            className={`w-full rounded-lg pl-8 pr-7 py-1.5 text-xs border focus:outline-none transition ${
              isDark
                ? 'bg-gray-900 border-gray-700 text-white focus:border-emerald-500'
                : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 📁 Main File Explorer Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Windows Sidebar (Folder Navigation Tree) */}
        <div
          className={`w-52 border-r hidden md:flex flex-col text-xs p-2 overflow-y-auto ${
            isDark ? 'bg-gray-900/60 border-gray-800 text-gray-300' : 'bg-slate-50/80 border-slate-200 text-slate-700'
          }`}
        >
          <div className="px-2 py-1.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Quick Access</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>

          <button
            onClick={() => onNavigateFolder([])}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
              folderPath.length === 0
                ? isDark
                  ? 'bg-emerald-950/70 text-emerald-300 font-semibold'
                  : 'bg-emerald-100/70 text-emerald-900 font-semibold'
                : 'hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate">Root Archives</span>
          </button>

          {/* Root Level Folders */}
          <div className="mt-2 space-y-0.5">
            <div className="px-2 py-1 font-semibold text-[10px] uppercase text-gray-400">Folders</div>
            {rootCards
              .filter((c) => c.targetType === 'folder')
              .map((folder) => {
                const isCurrent = folderPath[0] === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => onNavigateFolder([folder.id])}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition text-xs ${
                      isCurrent
                        ? isDark
                          ? 'bg-amber-950/60 text-amber-300 font-semibold'
                          : 'bg-amber-100/80 text-amber-900 font-semibold'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{folder.title}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className="flex-1 p-4 overflow-y-auto min-h-[420px]"
          onClick={() => setSelectedId(null)}
        >
          {processedCards.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 opacity-75">
              <Folder className="w-16 h-16 text-gray-400/50 mb-3 stroke-[1.2]" />
              <p className="font-semibold text-sm">This folder is empty</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                {isAdmin
                  ? 'Click "New Folder", "New Item", or "Upload" in the toolbar above to populate this directory.'
                  : 'No materials found matching your search in this directory.'}
              </p>
            </div>
          ) : (
            <>
              {/* 1. LARGE ICONS VIEW */}
              {layout === 'large-icons' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {processedCards.map((card) => {
                    const isSelected = selectedId === card.id;
                    const isRenaming = renamingId === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(card.id);
                        }}
                        onDoubleClick={() => onCardClick(card)}
                        onContextMenu={(e) => {
                          if (isAdmin) {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedId(card.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, card });
                          }
                        }}
                        className={`group relative p-3 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-950/70 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                              : 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                            : isDark
                            ? 'bg-gray-800/40 hover:bg-gray-800 border-gray-700/60'
                            : 'bg-white hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="my-2">{renderItemIcon(card, 'lg')}</div>

                        {isRenaming ? (
                          <input
                            type="text"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleApplyRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplyRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="w-full text-xs font-semibold px-1 py-0.5 border rounded bg-white text-black text-center focus:outline-none"
                          />
                        ) : (
                          <span className="text-xs font-medium line-clamp-2 leading-tight max-w-full px-1">
                            {card.title}
                          </span>
                        )}

                        <span className={`text-[10px] mt-1 opacity-60 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {getFileSizeString(card)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. MEDIUM ICONS VIEW */}
              {layout === 'medium-icons' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {processedCards.map((card) => {
                    const isSelected = selectedId === card.id;
                    const isRenaming = renamingId === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(card.id);
                        }}
                        onDoubleClick={() => onCardClick(card)}
                        onContextMenu={(e) => {
                          if (isAdmin) {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedId(card.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, card });
                          }
                        }}
                        className={`group relative p-2.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-950/70 border-emerald-500 shadow ring-1 ring-emerald-500'
                              : 'bg-emerald-50 border-emerald-500 shadow ring-1 ring-emerald-500'
                            : isDark
                            ? 'bg-gray-800/40 hover:bg-gray-800 border-gray-700/60'
                            : 'bg-white hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="my-1.5">{renderItemIcon(card, 'md')}</div>

                        {isRenaming ? (
                          <input
                            type="text"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleApplyRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplyRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="w-full text-xs font-semibold px-1 py-0.5 border rounded bg-white text-black text-center focus:outline-none"
                          />
                        ) : (
                          <span className="text-xs font-medium line-clamp-2 leading-tight max-w-full px-1">
                            {card.title}
                          </span>
                        )}

                        <span className={`text-[10px] mt-0.5 opacity-60 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {getItemTypeString(card)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2b. SMALL ICONS VIEW */}
              {layout === 'small-icons' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {processedCards.map((card) => {
                    const isSelected = selectedId === card.id;
                    const isRenaming = renamingId === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(card.id);
                        }}
                        onDoubleClick={() => onCardClick(card)}
                        onContextMenu={(e) => {
                          if (isAdmin) {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedId(card.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, card });
                          }
                        }}
                        className={`group relative p-1.5 rounded-lg border flex flex-col items-center text-center cursor-pointer transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-950/70 border-emerald-500 shadow ring-1 ring-emerald-500'
                              : 'bg-emerald-50 border-emerald-500 shadow ring-1 ring-emerald-500'
                            : isDark
                            ? 'bg-gray-800/40 hover:bg-gray-800 border-gray-700/60'
                            : 'bg-white hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="my-1">{renderItemIcon(card, 'sm')}</div>

                        {isRenaming ? (
                          <input
                            type="text"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleApplyRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplyRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="w-full text-[11px] font-semibold px-1 py-0.5 border rounded bg-white text-black text-center focus:outline-none"
                          />
                        ) : (
                          <span className="text-[11px] font-medium line-clamp-1 leading-tight max-w-full px-0.5">
                            {card.title}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. LIST VIEW */}
              {layout === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {processedCards.map((card) => {
                    const isSelected = selectedId === card.id;
                    const isRenaming = renamingId === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(card.id);
                        }}
                        onDoubleClick={() => onCardClick(card)}
                        onContextMenu={(e) => {
                          if (isAdmin) {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedId(card.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, card });
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-950/70 border-emerald-500 shadow-sm'
                              : 'bg-emerald-50 border-emerald-500 shadow-sm'
                            : isDark
                            ? 'bg-gray-800/30 hover:bg-gray-800 border-gray-700/50'
                            : 'bg-white hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {renderItemIcon(card, 'sm')}
                        {isRenaming ? (
                          <input
                            type="text"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleApplyRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplyRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="w-full text-xs font-semibold px-1 py-0.5 border rounded bg-white text-black focus:outline-none"
                          />
                        ) : (
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{card.title}</p>
                            <p className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              {card.subtitle || getItemTypeString(card)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. DETAILS TABLE VIEW */}
              {layout === 'details' && (
                <div className="border rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr
                        className={`border-b font-semibold text-[11px] uppercase tracking-wider ${
                          isDark ? 'bg-gray-800/80 border-gray-700 text-gray-300' : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}
                      >
                        <th className="p-2.5 pl-3">Name</th>
                        <th className="p-2.5 hidden sm:table-cell">Type</th>
                        <th className="p-2.5 hidden md:table-cell">Description</th>
                        <th className="p-2.5 text-right pr-3">Size / Count</th>
                        {isAdmin && <th className="p-2.5 text-center w-24">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {processedCards.map((card) => {
                        const isSelected = selectedId === card.id;
                        const isRenaming = renamingId === card.id;
                        return (
                          <tr
                            key={card.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(card.id);
                            }}
                            onDoubleClick={() => onCardClick(card)}
                            onContextMenu={(e) => {
                              if (isAdmin) {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedId(card.id);
                                setContextMenu({ x: e.clientX, y: e.clientY, card });
                              }
                            }}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? isDark
                                  ? 'bg-emerald-950/70 text-emerald-200'
                                  : 'bg-emerald-50 text-emerald-950 font-medium'
                                : isDark
                                ? 'hover:bg-gray-800/60'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-2.5 pl-3">
                              <div className="flex items-center gap-2">
                                {renderItemIcon(card, 'sm')}
                                {isRenaming ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={handleApplyRename}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleApplyRename();
                                      if (e.key === 'Escape') setRenamingId(null);
                                    }}
                                    className="text-xs font-semibold px-1 py-0.5 border rounded bg-white text-black focus:outline-none"
                                  />
                                ) : (
                                  <span className="font-medium truncate max-w-xs">{card.title}</span>
                                )}
                              </div>
                            </td>
                            <td className={`p-2.5 hidden sm:table-cell text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              {getItemTypeString(card)}
                            </td>
                            <td className={`p-2.5 hidden md:table-cell text-[11px] truncate max-w-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              {card.subtitle || '--'}
                            </td>
                            <td className={`p-2.5 text-right pr-3 font-mono text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              {getFileSizeString(card)}
                            </td>
                            {isAdmin && (
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEditModal(card);
                                    }}
                                    className="p-1 hover:text-emerald-500 text-gray-400"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRequestDelete(card.id);
                                    }}
                                    className="p-1 hover:text-red-500 text-gray-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 📊 Windows 11 Status Bar */}
      <div
        className={`px-3 py-1.5 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'bg-gray-850 border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>{processedCards.length} {processedCards.length === 1 ? 'item' : 'items'}</span>
          {selectedId && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              1 item selected
            </span>
          )}
          {isCloudSyncing && (
            <span className="flex items-center gap-1 text-blue-500 font-medium animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Syncing cloud folders...</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Windows 11 File Explorer Mode</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* 🖱️ Context Menu for Admin Right-Click */}
      {contextMenu && isAdmin && (
        <div
          className={`fixed z-50 rounded-xl border shadow-2xl py-1.5 w-48 text-xs animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-gray-850 border-gray-700 text-gray-100' : 'bg-white border-slate-300 text-slate-800'
          }`}
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.card ? (
            <>
              <div className="px-3 py-1 font-semibold text-[11px] truncate opacity-70 border-b border-gray-700/50 mb-1">
                {contextMenu.card.title}
              </div>
              <button
                onClick={() => {
                  onCardClick(contextMenu.card!);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open</span>
              </button>
              <button
                onClick={() => {
                  handleCopy(contextMenu.card!);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                onClick={() => {
                  handleCut(contextMenu.card!);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cut (Move)</span>
              </button>
              <button
                onClick={() => {
                  handleStartRename(contextMenu.card!);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <button
                onClick={() => {
                  onOpenEditModal(contextMenu.card!);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Properties / Edit</span>
              </button>
              <div className="border-t border-gray-700/50 my-1" />
              <button
                onClick={() => {
                  handleRequestDelete(contextMenu.card!.id);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-red-500 hover:bg-red-600 hover:text-white transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleNewFolder();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddModal();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>New Resource Card</span>
              </button>
              <button
                onClick={() => {
                  onOpenUpload();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-emerald-600 hover:text-white transition"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>Upload File</span>
              </button>
              {onOpenMultiUpload && (
                <button
                  onClick={() => {
                    onOpenMultiUpload();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-purple-600 hover:text-white transition"
                >
                  <Files className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upload Multiple Files</span>
                </button>
              )}
              {clipboardItem && (
                <>
                  <div className="border-t border-gray-700/50 my-1" />
                  <button
                    onClick={() => {
                      handlePaste();
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-indigo-600 hover:text-white transition"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* 🗑️ Windows 11 Native In-App Delete Confirmation Modal */}
      {cardPendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl border overflow-hidden p-5 ${
              isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {cardPendingDelete.targetType === 'folder' ? 'Delete Folder' : 'Delete Item'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className={`p-3.5 my-3 rounded-lg border text-xs ${
                isDark ? 'bg-gray-800/60 border-gray-700/70' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="font-semibold text-sm truncate mb-1">
                {cardPendingDelete.title}
              </p>
              <p className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                {cardPendingDelete.targetType === 'folder'
                  ? `Are you sure you want to permanently delete this folder and all ${
                      cardPendingDelete.children?.length || 0
                    } items inside?`
                  : `Are you sure you want to permanently delete this resource?`}
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCardPendingDelete(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
