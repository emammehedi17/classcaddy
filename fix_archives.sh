sed -i '/const handleOpenDeveloperAuth = () => {/,/  };/c\  const handleOpenDeveloperAuth = () => {\n    setShowAuthModal(true);\n  };' src/components/ArchivesView.tsx
sed -i '/useEffect(() => {/,/  }, \[isSuperAdmin\]);/d' src/components/ArchivesView.tsx
