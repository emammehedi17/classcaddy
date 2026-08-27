const fs = require('fs');
let content = fs.readFileSync('src/components/ArchivesView.tsx', 'utf8');

const target1 = `  const handleOpenDeveloperAuth = () => {
    if (isSuperAdmin) {
      setIsDeveloperMode(true);
      sessionStorage.setItem(DEV_AUTH_KEY, 'true');
    } else {
      setShowAuthModal(true);
    }
  };`;

const replacement1 = `  const handleOpenDeveloperAuth = () => {
    setShowAuthModal(true);
  };`;

content = content.replace(target1, replacement1);

const target2 = `  useEffect(() => {
    if (isSuperAdmin) {
      setIsDeveloperMode(true);
      sessionStorage.setItem(DEV_AUTH_KEY, 'true');
    }
  }, [isSuperAdmin]);`;

content = content.replace(target2, '');

fs.writeFileSync('src/components/ArchivesView.tsx', content);
