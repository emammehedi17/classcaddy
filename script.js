document.addEventListener('DOMContentLoaded', function () {

    /* ==========================================================================
     * 1. Academic Dropdown Menu Logic
     * ========================================================================== */
    const academicDropdown = document.getElementById('academic-dropdown');
    if (academicDropdown) {
        const menu = document.getElementById('academic-menu');
        const button = document.getElementById('academic-button');
        let hideTimeout;
        const showMenu = () => { clearTimeout(hideTimeout); menu.classList.add('is-open'); };
        const hideMenu = () => { menu.classList.remove('is-open'); };
        const hideMenuWithDelay = () => { hideTimeout = setTimeout(hideMenu, 3000); };
        button.addEventListener('click', (event) => { event.stopPropagation(); menu.classList.toggle('is-open'); });
        academicDropdown.addEventListener('mouseenter', showMenu);
        academicDropdown.addEventListener('mouseleave', hideMenuWithDelay);
        window.addEventListener('click', (event) => { if (!academicDropdown.contains(event.target)) { hideMenu(); } });
    }

    /* ==========================================================================
     * 2. Action Buttons, Player Visibility & ADVANCED ZOOM
     * ========================================================================== */
    const actionButtonsContainer = document.getElementById('action-buttons-container');
    const goToTopBtn = document.getElementById('go-to-top-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    const musicPlayer = document.getElementById('music-player');
    const printBtn = document.getElementById('print-btn'); // <-- ADD THIS LINE
    const zoomControls = document.getElementById('zoom-controls');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomPercentageInput = document.getElementById('zoom-percentage');
    const mainContent = document.querySelector('.main-content');
    let currentScale = 1.0;

    function applyZoom(newScale) {
        currentScale = Math.max(0.5, Math.min(3.0, newScale));
        if (mainContent) {
            mainContent.style.transform = `scale(${currentScale})`;
        }
        if (zoomPercentageInput) {
            zoomPercentageInput.value = `${Math.round(currentScale * 100)}%`;
        }
    }

    function handleScrollVisibility() {
        const shouldBeVisible = window.pageYOffset > 300;
        if (actionButtonsContainer) actionButtonsContainer.classList.toggle('visible', shouldBeVisible);
        if (musicPlayer) {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const mainContentRect = mainContent.getBoundingClientRect();
                const isPlayerInView = mainContentRect.top < window.innerHeight && mainContentRect.bottom > 0;
                musicPlayer.classList.toggle('visible', isPlayerInView);
            }
        }
    }

    window.addEventListener('scroll', handleScrollVisibility);
    window.addEventListener('load', handleScrollVisibility);

    if (actionButtonsContainer) {
        if (goToTopBtn) {
            goToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.error(err));
                } else {
                    document.exitFullscreen();
                }
            });
        }
        
		
		// Add this block for the print button
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
	
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                applyZoom(currentScale + 0.10);
            });
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                applyZoom(currentScale - 0.10);
            });
        }
        if (zoomPercentageInput) {
            zoomPercentageInput.addEventListener('change', () => {
                const newPercentage = parseFloat(zoomPercentageInput.value.replace('%', ''));
                if (!isNaN(newPercentage)) {
                    applyZoom(newPercentage / 100);
                } else {
                    zoomPercentageInput.value = `${Math.round(currentScale * 100)}%`;
                }
            });
        }

        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            if (fullscreenIcon) {
                fullscreenIcon.classList.toggle('fa-compress', isFullscreen);
                fullscreenIcon.classList.toggle('fa-expand', !isFullscreen);
            }
            document.body.classList.toggle('is-fullscreen', isFullscreen);
            if (!isFullscreen) {
                applyZoom(1.0);
                if (mainContent) mainContent.style.transform = '';
            }
        });
    }

    /* ==========================================================================
     * 3. Index Page Specific Logic (Login/Signup Forms)
     * ========================================================================== */
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (loginForm || signupForm) {
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('signup-password');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.innerHTML = type === 'password' ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
            });
        }
        const signupSection = document.getElementById('signup-section');
        const loginGlow = document.getElementById('login-glow');
        const signupGlow = document.getElementById('signup-glow');
        function scrollToSignup() { if (signupSection) { signupSection.scrollIntoView({ behavior: 'smooth' }); if (signupGlow) signupGlow.classList.add('login-glow-active'); document.getElementById('signup-name')?.focus(); } }
        function scrollToLogin() { const loginContainer = document.querySelector('.login-form-container'); if (loginContainer) { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { if (loginGlow) loginGlow.classList.add('login-glow-active'); document.getElementById('login-email')?.focus(); }, 500); } }
        if (window.location.hash === '#signup') { history.replaceState(null, null, ' '); setTimeout(scrollToSignup, 300); }
        document.querySelectorAll('[href="#signup"], .signup-button').forEach(button => { button.addEventListener('click', function(e) { e.preventDefault(); scrollToSignup(); }); });
        document.querySelectorAll('.login-redirect').forEach(link => { link.addEventListener('click', function(e) { e.preventDefault(); scrollToLogin(); }); });
        const loginInputs = [document.getElementById('login-email'), document.getElementById('login-password')];
        if(loginGlow && loginInputs.every(i => i)) { const handleFocus = () => loginGlow.classList.add('login-glow-active'); const handleBlur = () => { setTimeout(() => { if (!loginInputs.some(i => i === document.activeElement)) { loginGlow.classList.remove('login-glow-active'); } }, 100); }; loginInputs.forEach(input => { input.addEventListener('focus', handleFocus); input.addEventListener('blur', handleBlur); }); }
        const signupInputs = [document.getElementById('signup-name'), document.getElementById('signup-email'), document.getElementById('signup-mobile'), document.getElementById('signup-password')];
        if (signupGlow && signupInputs.every(i => i)) { const handleFocus = () => signupGlow.classList.add('login-glow-active'); const handleBlur = () => { setTimeout(() => { if (!signupInputs.some(i => i === document.activeElement)) { signupGlow.classList.remove('login-glow-active'); } }, 100); }; signupInputs.forEach(input => { input.addEventListener('focus', handleFocus); input.addEventListener('blur', handleBlur); }); }
    }

    /* ==========================================================================
     * 4. Hide "Continued" Titles on Poem Pages
     * ========================================================================== */
    const sectionTitles = document.querySelectorAll('.section-title');
    let firstWordByWordFound = false;
    let firstLineByLineFound = false;

    sectionTitles.forEach(title => {
        const titleText = title.textContent.toLowerCase();
        
        if (titleText.includes('word-by-word')) {
            if (firstWordByWordFound) {
                title.style.display = 'none';
            }
            firstWordByWordFound = true;
        }
        
        if (titleText.includes('line-by-line')) {
            if (firstLineByLineFound) {
                title.style.display = 'none';
            }
            firstLineByLineFound = true;
        }
    });


    /* ==========================================================================
     * 5. Music Player Logic (with Auto-Hide)
     * ========================================================================== */
    if (musicPlayer) {
        const audio = document.getElementById('audio-source');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const playPauseIcon = document.getElementById('play-pause-icon');
        const playerHoverArea = document.getElementById('player-hover-area');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const progressBar = document.getElementById('progress-bar');
        const progressBarContainer = document.getElementById('progress-bar-container');
        const progressTooltip = document.getElementById('progress-tooltip');
        const currentTimeEl = document.getElementById('current-time');
        const totalDurationEl = document.getElementById('total-duration');
        let hidePlayerTimeout;
        let isPlaying = false;

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        audio.addEventListener('loadedmetadata', () => {
            if (audio.duration && !isNaN(audio.duration)) {
                totalDurationEl.textContent = formatTime(audio.duration);
            }
        });

        progressBarContainer.addEventListener('mousemove', (e) => {
            if (!audio.duration || isNaN(audio.duration)) return;
            const containerWidth = progressBarContainer.clientWidth;
            const hoverPositionX = e.offsetX;
            const hoverTime = (hoverPositionX / containerWidth) * audio.duration;
            progressTooltip.textContent = formatTime(hoverTime);
            progressTooltip.style.left = `${hoverPositionX}px`;
        });
        progressBarContainer.addEventListener('mouseover', () => {
            if (audio.duration && !isNaN(audio.duration)) {
                progressTooltip.classList.add('visible');
            }
        });
        progressBarContainer.addEventListener('mouseleave', () => {
            progressTooltip.classList.remove('visible');
        });

        function playAudio() {
            audio.play();
            isPlaying = true;
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
            if (window.innerWidth > 1024) {
                hidePlayerTimeout = setTimeout(() => musicPlayer.classList.add('player-hidden'), 2000);
            }
        }

        function pauseAudio() {
            audio.pause();
            isPlaying = false;
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
            clearTimeout(hidePlayerTimeout);
            musicPlayer.classList.remove('player-hidden');
        }

        function togglePlayPause() { isPlaying ? pauseAudio() : playAudio(); }
        
        if(prevBtn) prevBtn.style.display = 'none';
        if(nextBtn) nextBtn.style.display = 'none';

        function updateProgress() {
            const { duration, currentTime } = audio;
            if (duration) {
                const progressPercent = (currentTime / duration) * 100;
                progressBar.style.width = `${progressPercent}%`;
                totalDurationEl.textContent = formatTime(duration);
            }
            currentTimeEl.textContent = formatTime(currentTime);
        }

        function setProgress(e) {
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            if (duration) { audio.currentTime = (clickX / width) * duration; }
        }

        playPauseBtn.addEventListener('click', togglePlayPause);
        audio.addEventListener('timeupdate', updateProgress);
        progressBarContainer.addEventListener('click', setProgress);
        
        audio.addEventListener('ended', () => {
            pauseAudio();
            audio.currentTime = 0;
        });

        if (window.innerWidth > 1024) {
            playerHoverArea.addEventListener('mouseenter', () => {
                clearTimeout(hidePlayerTimeout);
                musicPlayer.classList.remove('player-hidden');
            });
            musicPlayer.addEventListener('mouseleave', () => {
                if (isPlaying) { 
                    hidePlayerTimeout = setTimeout(() => musicPlayer.classList.add('player-hidden'), 500); 
                }
            });
        }
    }

    /* ==========================================================================
     * 6. Header Scroll Effect Logic
     * ========================================================================== */
    const header = document.querySelector('header');
    if (header) {
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            header.classList.toggle('header-hidden', currentScrollY > lastScrollY && currentScrollY > 100);
            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        });
    }

    /* ==========================================================================
     * 7. Mobile Navigation Logic
     * ========================================================================== */
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileAcademicButton = document.getElementById('mobile-academic-button');
    const mobileAcademicMenu = document.getElementById('mobile-academic-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    if (mobileAcademicButton && mobileAcademicMenu) {
        mobileAcademicButton.addEventListener('click', () => {
            mobileAcademicMenu.classList.toggle('hidden');
            const arrowIcon = mobileAcademicButton.querySelector('svg');
            if (arrowIcon) {
                arrowIcon.classList.toggle('rotate-180');
            }
        });
    }
	
	/* ==========================================================================
     * 8. Responsive Back Button Text
     * ========================================================================== */
    const backButton = document.querySelector('.breadcrumbs-container a:last-child');

    if (backButton) {
        const originalBackButtonHTML = backButton.innerHTML; // Store the original full text
        const iconSVG = backButton.querySelector('svg')?.outerHTML || ''; // Get the arrow icon

        const updateBackButtonText = () => {
            // Check if the screen width is less than 768px (standard for mobile/tablet)
            if (window.innerWidth < 768) {
                // On mobile, create the simple "Back" button
                backButton.innerHTML = iconSVG + ' Back';
            } else {
                // On desktop, restore the original full text
                backButton.innerHTML = originalBackButtonHTML;
            }
        };

        // Run the function on initial page load
        updateBackButtonText();

        // And run it again whenever the window is resized
        window.addEventListener('resize', updateBackButtonText);
    }
	
	
	/* ================================================= */
	/* == 9. Karaoke Highlighting and Scrolling Function == */
	/* ================================================= */

	/**
	 * Initializes the karaoke highlighting functionality on a page.
	 * This function is designed to be called automatically if the required
	 * elements and data (lineTimings) are present.
	 * @param {Array} timings - The array of timestamp objects for the current page.
	 */
	function setupKaraoke(timings) {
		const audio = document.getElementById('audio-source');
		const lines = Array.from(document.querySelectorAll('tbody tr[id^="line-"]'));
		let currentHighlight = null;

		if (!audio || lines.length === 0) {
			// Exit if essential elements aren't found
			return;
		}

		// --- Click-to-seek functionality for each table row ---
		lines.forEach(lineEl => {
			const lineData = timings.find(t => t.id === lineEl.id);
			if (lineData) {
				lineEl.addEventListener('click', () => {
					audio.currentTime = lineData.start;
					if (audio.paused) {
						audio.play();
					}
				});
			}
		});

		// --- Main listener to update highlight during playback ---
		audio.addEventListener('timeupdate', function() {
			const currentTime = audio.currentTime;
			let activeLine = null;

			for (const timing of timings) {
				if (currentTime >= timing.start && currentTime < timing.end) {
					activeLine = document.getElementById(timing.id);
					break;
				}
			}

			if (activeLine && activeLine !== currentHighlight) {
				// Remove highlight from the previous line
				if (currentHighlight) {
					currentHighlight.classList.remove('highlight');
				}
				// Add highlight to the new active line
				activeLine.classList.add('highlight');
				currentHighlight = activeLine;

				// Auto-scroll to the highlighted line
				currentHighlight.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
		});

		// --- Cleanup when the audio finishes ---
		audio.addEventListener('ended', function() {
			if (currentHighlight) {
				currentHighlight.classList.remove('highlight');
				currentHighlight = null;
			}
		});
	}

/* ==========================================================================
 * 10. Auto-scroll to Academic Courses on Index Page
 * ========================================================================== */
// Check if the current page is the index page by looking for a unique element,
// like the login form.
const loginFormForScroll = document.getElementById('login-form');
const academicCoursesSection = document.getElementById('academic-courses');

// If we are on the index page and the academic section exists...
if (loginFormForScroll && academicCoursesSection) {
    // Scroll to the section after a short delay to ensure the page has loaded smoothly.
    setTimeout(() => {
        academicCoursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500); // 500ms delay
}

/* ==========================================================================
 * 11. Auto-scroll to Course Contents on Course Pages
 * ========================================================================== */
// Check if an element with the ID 'course-contents' exists on the page.
const courseContentsSection = document.getElementById('course-contents');

// If the section exists, it implies we are on a course page.
if (courseContentsSection) {
    // Scroll to the section after a short delay.
    setTimeout(() => {
        courseContentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500); // 500ms delay
}


/* ==========================================================================
 * 12. Make all download links open in a new tab
 * ========================================================================== */
const downloadButtons = document.querySelectorAll('.download-btn');
downloadButtons.forEach(button => {
    button.setAttribute('target', '_blank');
    button.setAttribute('rel', 'noopener noreferrer'); // For security
});


	// --- Auto-starter ---
// This code is ALREADY inside a DOMContentLoaded listener,
// so we just check for the variable and run the setup function directly.
if (typeof lineTimings !== 'undefined') {
    setupKaraoke(lineTimings);
}
});


// ===== START: ACTIVE NAVIGATION SCRIPT =====
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const pageName = path.split("/").pop();

    // --- Define which pages belong to the 'Academic' section ---
    const isAcademicPage = path.includes('academic.html') || 
                           path.includes('course-') || 
                           path.includes('poem-') || 
                           path.includes('biography-');

    // --- Select Navigation Elements ---
    const academicButton = document.getElementById('academic-button');
    const homeLink = document.querySelector('.hidden.md\\:flex a[href="index.html"]');
    // Add other links here if you want them to be active on their pages
    // const shopLink = document.querySelector('.hidden.md\\:flex a[href="shop.html"]');

    // --- Logic to Apply Active Styles ---
    if (isAcademicPage) {
        // If it's an academic page, make the 'Academic' button green
        academicButton.classList.add('bg-emerald-500');
        academicButton.classList.remove('text-gray-400', 'hover:text-white');
    } else if (pageName === 'index.html' || pageName === '') {
        // If it's the homepage, make the 'Home' link green
        homeLink.classList.add('bg-emerald-500', 'rounded-full');
        homeLink.classList.remove('text-gray-400');
    }
    // You can add more 'else if' blocks here for 'Shop', 'About', etc.
});
// ===== END: ACTIVE NAVIGATION SCRIPT =====

// ===== START: SMOOTH SCROLL SCRIPT =====
document.addEventListener('DOMContentLoaded', () => {
    // This targets any link that starts with "index.html#"
    const scrollLinks = document.querySelectorAll('a[href^="index.html#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Check if we are already on the homepage
            const onHomePage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
            const hash = this.hash; // Gets the '#signup' part

            if (onHomePage) {
                e.preventDefault(); // Stop the default jump
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    // Perform a smooth scroll to the target
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // If we are NOT on the homepage, the link will work normally,
            // taking the user to index.html and then jumping to the section.
        });
    });
});
// ===== END: SMOOTH SCROLL SCRIPT =====

// ===== START: GLOBAL DARK MODE, SCROLL TOGGLE & UNIVERSAL AUTH SYNC =====
(function () {
    // 1. Universal Theme Manager
    function getStoredTheme() {
        const directTheme = localStorage.getItem('class_caddy_theme');
        if (directTheme) return directTheme;
        try {
            const spSettings = localStorage.getItem('studyPlanSettings');
            if (spSettings) {
                const parsed = JSON.parse(spSettings);
                if (parsed && typeof parsed.darkMode === 'boolean') {
                    return parsed.darkMode ? 'dark' : 'light';
                }
            }
        } catch (e) {}
        return 'light';
    }

    function applyGlobalTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.documentElement.classList.add('dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.classList.remove('dark');
        }
        
        const darkBtn = document.getElementById('global-dark-mode-btn');
        if (darkBtn) {
            darkBtn.innerHTML = isDark 
                ? '<i class="fas fa-sun text-2xl text-amber-400"></i>' 
                : '<i class="fas fa-moon text-2xl text-yellow-400"></i>';
            darkBtn.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
        }
    }

    window.toggleGlobalTheme = function () {
        const isCurrentlyDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');
        const nextIsDark = !isCurrentlyDark;
        applyGlobalTheme(nextIsDark);
        localStorage.setItem('class_caddy_theme', nextIsDark ? 'dark' : 'light');
        try {
            const sp = JSON.parse(localStorage.getItem('studyPlanSettings') || '{}');
            sp.darkMode = nextIsDark;
            localStorage.setItem('studyPlanSettings', JSON.stringify(sp));
        } catch (e) {}
        try {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'class_caddy_theme',
                newValue: nextIsDark ? 'dark' : 'light'
            }));
        } catch (e) {}
    };

    // Apply theme immediately to prevent flash
    const initialThemeIsDark = getStoredTheme() === 'dark';
    if (initialThemeIsDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
    }

    // 2. Ensure Floating Action Buttons exist on DOM
    function ensureFloatingButtons() {
        // If this page mounts React App with FloatingActionButtons, do not inject duplicate HTML buttons
        if (document.getElementById('root')) {
            return;
        }

        // Scroll Toggle Button
        let scrollBtn = document.getElementById('scroll-toggle-btn');
        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.id = 'scroll-toggle-btn';
            scrollBtn.className = 'fixed bottom-24 right-5 z-[999] w-12 h-12 bg-gray-700 hover:bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none opacity-90 hover:opacity-100 cursor-pointer border border-gray-600/30';
            scrollBtn.title = 'Scroll to Bottom';
            scrollBtn.setAttribute('aria-label', 'Scroll to Bottom');
            scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
            document.body.appendChild(scrollBtn);
        }

        if (scrollBtn) {
            const updateScrollIcon = () => {
                const icon = scrollBtn.querySelector('i');
                if (!icon) return;
                const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                if (scrollPos > 300) {
                    icon.className = 'fas fa-arrow-up';
                    scrollBtn.title = "Scroll to Top";
                    scrollBtn.setAttribute('aria-label', "Scroll to Top");
                } else {
                    icon.className = 'fas fa-arrow-down';
                    scrollBtn.title = "Scroll to Bottom";
                    scrollBtn.setAttribute('aria-label', "Scroll to Bottom");
                }
            };

            window.removeEventListener('scroll', updateScrollIcon);
            window.addEventListener('scroll', updateScrollIcon, { passive: true });
            updateScrollIcon();

            scrollBtn.onclick = (e) => {
                if (e) e.preventDefault();
                const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                if (scrollPos > 300) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const maxScroll = Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight,
                        document.body.offsetHeight,
                        document.documentElement.offsetHeight,
                        document.body.clientHeight,
                        document.documentElement.clientHeight
                    );
                    window.scrollTo({ top: maxScroll, behavior: 'smooth' });
                }
            };
        }

        // Global Dark Mode Button
        let darkBtn = document.getElementById('global-dark-mode-btn');
        if (!darkBtn) {
            darkBtn = document.createElement('button');
            darkBtn.id = 'global-dark-mode-btn';
            darkBtn.className = 'fixed bottom-6 right-5 w-14 h-14 bg-gray-800 text-yellow-400 rounded-full shadow-2xl border-2 border-gray-700 z-[999] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer';
            darkBtn.title = initialThemeIsDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
            darkBtn.setAttribute('aria-label', 'Toggle Dark Mode');
            darkBtn.innerHTML = initialThemeIsDark 
                ? '<i class="fas fa-sun text-2xl text-amber-400"></i>' 
                : '<i class="fas fa-moon text-2xl text-yellow-400"></i>';
            document.body.appendChild(darkBtn);
        }

        if (darkBtn) {
            darkBtn.onclick = (e) => {
                if (e) e.preventDefault();
                window.toggleGlobalTheme();
            };
        }
    }

    // 3. Dynamic Navigation Active-Tab Highlighting
    function syncNavigationState() {
        const path = (window.location.pathname || '').toLowerCase();
        let activePage = 'home';
        if (path.includes('study_plan') || path.includes('study-plan')) {
            activePage = 'study_plan';
        } else if (path.includes('archives')) {
            activePage = 'archives';
        } else if (path.includes('about')) {
            activePage = 'about';
        } else if (path.includes('contact')) {
            activePage = 'contact';
        } else if (path.includes('academic') || path.includes('course-')) {
            activePage = 'archives';
        } else if (path.includes('index') || path === '/' || path.endsWith('/')) {
            activePage = 'home';
        }

        // Desktop center nav links
        const desktopNavLinks = document.querySelectorAll('#header-desktop-nav-tabs a, header nav .hidden.md\\:flex a, header nav div.md\\:flex a');
        desktopNavLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (link.closest('#auth-container-desktop') || link.closest('#auth-container-mobile') || link.classList.contains('signup-button') || href.includes('facebook') || href.includes('du.ac.bd') || link.querySelector('img')) {
                return;
            }
            const isMatch = 
                (activePage === 'home' && (href === 'index.html' || href === '/' || href === '')) ||
                (activePage === 'archives' && (href === 'archives.html' || href.includes('archives.html'))) ||
                (activePage === 'study_plan' && href.includes('study_plan')) ||
                (activePage === 'about' && href.includes('about')) ||
                (activePage === 'contact' && href.includes('contact'));

            link.classList.remove('bg-emerald-500', 'text-white', 'font-medium', 'shadow-sm', 'text-emerald-600', 'bg-emerald-50', 'text-gray-600', 'text-gray-700', 'text-gray-300');
            
            if (isMatch) {
                link.classList.add('bg-emerald-500', 'text-white', 'font-medium', 'shadow-sm');
            } else {
                link.classList.add('text-gray-600', 'dark:text-gray-300');
            }
        });

        // Mobile nav links
        const mobileLinks = document.querySelectorAll('#mobile-menu a');
        mobileLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (link.closest('#auth-container-desktop') || link.closest('#auth-container-mobile') || link.classList.contains('signup-button')) {
                return;
            }
            const isMatch = 
                (activePage === 'home' && (href === 'index.html' || href === '/' || href === '')) ||
                (activePage === 'archives' && href.includes('archives')) ||
                (activePage === 'study_plan' && href.includes('study_plan')) ||
                (activePage === 'about' && href.includes('about')) ||
                (activePage === 'contact' && href.includes('contact'));

            link.classList.remove('text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/40', 'text-gray-700', 'text-gray-300', 'font-semibold');
            if (isMatch) {
                link.classList.add('text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/40', 'font-semibold');
            } else {
                link.classList.add('text-gray-700', 'dark:text-gray-300');
            }
        });
    }

    // 4. Firebase Google Sign-In Initialization for Static Pages
    let firebaseAuthInstance = null;
    let googleAuthProvider = null;
    let isFirebaseLoaded = false;

    async function initFirebaseForStaticPages() {
        if (isFirebaseLoaded || window._fb_auth_initialized) return;
        try {
            const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
            const { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
            
            const firebaseConfig = {
                apiKey: "AIzaSyAj7MDnrnzKUO73BXG0jeM-uBGrAH3XiAY",
                authDomain: "study-plan17.firebaseapp.com",
                projectId: "study-plan17"
            };

            const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
            firebaseAuthInstance = getAuth(app);
            googleAuthProvider = new GoogleAuthProvider();
            isFirebaseLoaded = true;
            window._fb_auth_instance = firebaseAuthInstance;
            window._fb_google_provider = googleAuthProvider;
            window._fb_auth_initialized = true;

            onAuthStateChanged(firebaseAuthInstance, (user) => {
                if (user) {
                    const profile = {
                        name: user.displayName || user.email?.split('@')[0] || 'User',
                        email: user.email || '',
                        photoURL: user.photoURL || null,
                        isLoggedIn: true
                    };
                    localStorage.setItem('cc_auth_user', JSON.stringify({
                        uid: user.uid,
                        displayName: profile.name,
                        email: profile.email,
                        photoURL: profile.photoURL,
                        isLoggedIn: true
                    }));
                    localStorage.setItem('class_caddy_user', JSON.stringify(profile));
                }
                syncAuthUI();
            });
        } catch (err) {
            console.warn('Firebase lazy-load for static page:', err);
        }
    }

    window.triggerGoogleSignInGlobal = async function () {
        try {
            if (!isFirebaseLoaded) {
                await initFirebaseForStaticPages();
            }
            const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
            if (firebaseAuthInstance && googleAuthProvider) {
                const result = await signInWithPopup(firebaseAuthInstance, googleAuthProvider);
                if (result && result.user) {
                    const profile = {
                        name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
                        email: result.user.email || '',
                        photoURL: result.user.photoURL || null,
                        isLoggedIn: true
                    };
                    localStorage.setItem('cc_auth_user', JSON.stringify({
                        uid: result.user.uid,
                        displayName: profile.name,
                        email: profile.email,
                        photoURL: profile.photoURL,
                        isLoggedIn: true
                    }));
                    localStorage.setItem('class_caddy_user', JSON.stringify(profile));
                    syncAuthUI();
                }
            }
        } catch (e) {
            if (e && e.code === 'auth/unauthorized-domain') {
                const domain = window.location.hostname;
                let modal = document.getElementById('cc-unauth-domain-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'cc-unauth-domain-modal';
                    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.75);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,sans-serif;';
                    document.body.appendChild(modal);
                }
                modal.innerHTML = `
                    <div style="background:#ffffff;color:#1f2937;max-width:480px;width:100%;border-radius:12px;padding:20px 22px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.2);border:1px solid #e5e7eb;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                            <h3 style="margin:0;font-size:1.05rem;font-weight:700;color:#b91c1c;">Authorize Domain for Google Sign-In</h3>
                            <button id="cc-unauth-close-btn" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:#6b7280;">&times;</button>
                        </div>
                        <p style="font-size:0.85rem;color:#4b5563;line-height:1.5;margin:0 0 12px;">
                            This preview domain is not yet allowlisted in Firebase project <strong>study-plan17</strong>. Add the domain below in <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong>:
                        </p>
                        <div style="display:flex;align-items:center;gap:8px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:8px 10px;margin-bottom:14px;">
                            <code style="font-size:0.78rem;color:#111827;word-break:break-all;flex:1;">${domain}</code>
                            <button id="cc-unauth-copy-btn" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.75rem;font-weight:600;cursor:pointer;white-space:nowrap;">Copy Domain</button>
                        </div>
                        <div style="display:flex;justify-content:flex-end;gap:8px;">
                            <a href="https://console.firebase.google.com/project/study-plan17/authentication/settings" target="_blank" rel="noopener noreferrer" style="background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;padding:7px 12px;font-size:0.8rem;font-weight:600;">Open Firebase Console</a>
                            <button id="cc-unauth-ok-btn" style="background:#e5e7eb;color:#374151;border:none;border-radius:6px;padding:7px 14px;font-size:0.8rem;font-weight:600;cursor:pointer;">Close</button>
                        </div>
                    </div>
                `;
                modal.style.display = 'flex';
                const closeModal = () => { modal.style.display = 'none'; };
                modal.querySelector('#cc-unauth-close-btn')?.addEventListener('click', closeModal);
                modal.querySelector('#cc-unauth-ok-btn')?.addEventListener('click', closeModal);
                modal.querySelector('#cc-unauth-copy-btn')?.addEventListener('click', (ev) => {
                    navigator.clipboard?.writeText(domain);
                    ev.target.textContent = 'Copied!';
                });
                return;
            }
            console.warn('Google Sign-In Cancelled or Failed:', e);
        }
    };

    window.triggerGoogleSignOutGlobal = async function () {
        try {
            if (firebaseAuthInstance) {
                const { signOut } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
                await signOut(firebaseAuthInstance);
            }
        } catch (e) {}
        localStorage.removeItem('cc_auth_user');
        localStorage.removeItem('class_caddy_user');
        syncAuthUI();
    };

    // 5. Universal Auth UI Synchronization
    const googleSvgData = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Zz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ij48L3BhdGg+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDMS4yNSAxNi4xMyAwIDIwLjA4IDAgMjRjMCAzLjkyIDEuMjUgNy44NyAyLjk5IDEwLjk4bDcuNTQtNS45OXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMzRBMDMyIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ij48L3BhdGg+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgweiI+PC9wYXRoPjwvZz48L3N2Zz4=";

    function syncAuthUI() {
        let user = null;
        try {
            const raw1 = localStorage.getItem('cc_auth_user');
            if (raw1) user = JSON.parse(raw1);
        } catch (e) {}

        if (!user || !user.isLoggedIn) {
            try {
                const raw2 = localStorage.getItem('class_caddy_user');
                if (raw2) {
                    const parsed = JSON.parse(raw2);
                    if (parsed && (parsed.isLoggedIn || parsed.email || parsed.name)) {
                        user = {
                            isLoggedIn: true,
                            name: parsed.name || parsed.displayName || 'Learner',
                            email: parsed.email || '',
                            photoURL: parsed.photoURL || parsed.avatar || null
                        };
                    }
                }
            } catch (e) {}
        }

        // Update Desktop and Mobile Auth Containers on all pages
        const authDesktop = document.getElementById('auth-container-desktop');
        const authMobile = document.getElementById('auth-container-mobile');

        if (user && user.isLoggedIn) {
            const displayName = user.displayName || user.name || user.email?.split('@')[0] || 'User';
            const avatar = user.photoURL 
                ? `<img src="${user.photoURL}" alt="${displayName}" class="w-7 h-7 rounded-full object-cover border border-emerald-500 inline-block mr-2" onerror="this.src='https://placehold.co/28x28/059669/ffffff?text=${displayName.charAt(0).toUpperCase()}';" />`
                : `<span class="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold inline-flex items-center justify-center mr-2 text-xs shadow-sm">${displayName.charAt(0).toUpperCase()}</span>`;

            if (authDesktop) {
                authDesktop.innerHTML = `
                    <div class="flex items-center gap-2">
                        <a href="study_plan.html" class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-gray-700 border border-emerald-500/40 rounded-full transition shadow-sm group" title="Open Study Plan">
                            ${avatar}
                            <div class="text-left max-w-[120px]">
                                <p class="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-500 transition truncate">${displayName}</p>
                                <p class="text-[10px] text-gray-400 truncate">${user.email || 'My Study Plan'}</p>
                            </div>
                        </a>
                        <button onclick="window.triggerGoogleSignOutGlobal()" class="p-1.5 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition cursor-pointer" title="Logout">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                `;
            }

            if (authMobile) {
                authMobile.innerHTML = `
                    <div class="flex items-center justify-between">
                        <a href="study_plan.html" class="flex items-center gap-2 text-sm font-medium text-emerald-500">
                            ${avatar}
                            <span>${displayName}</span>
                        </a>
                        <button onclick="window.triggerGoogleSignOutGlobal()" class="text-xs font-medium text-red-500 hover:underline px-2 py-1 cursor-pointer">
                            Log out
                        </button>
                    </div>
                `;
            }
        } else {
            if (authDesktop) {
                authDesktop.innerHTML = `
                    <button type="button" onclick="window.triggerGoogleSignInGlobal()" class="header-google-signin-btn flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-full transition-all duration-200 text-sm font-medium shadow-sm hover:shadow cursor-pointer">
                        <img src="${googleSvgData}" alt="Google" class="w-4 h-4 flex-shrink-0" />
                        <span>Sign In</span>
                    </button>
                `;
            }

            if (authMobile) {
                authMobile.innerHTML = `
                    <button type="button" onclick="window.triggerGoogleSignInGlobal()" class="flex items-center justify-center gap-2.5 w-full py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-full transition text-sm font-medium shadow-sm cursor-pointer">
                        <img src="${googleSvgData}" alt="Google" class="w-4 h-4 flex-shrink-0" />
                        <span>Sign in with Google</span>
                    </button>
                `;
            }
        }

        // Find any remaining standalone sign up links or buttons
        const standaloneAuthElements = document.querySelectorAll(
            'a.signup-button, button.signup-button, a[href="index.html#signup"], a[href="study_plan.html#signup"], a[href="#signup"]'
        );

        standaloneAuthElements.forEach((el) => {
            if (el.closest('#auth-container-desktop') || el.closest('#auth-container-mobile')) return;
            if (user && user.isLoggedIn) {
                const displayName = user.displayName || user.name || user.email?.split('@')[0] || 'User';
                el.href = 'study_plan.html';
                el.innerHTML = `Study Plan (${displayName})`;
            } else {
                if (el.tagName === 'A') {
                    el.onclick = (e) => {
                        e.preventDefault();
                        window.triggerGoogleSignInGlobal();
                    };
                }
            }
        });
    }

    // Initialize all logic
    function initAll() {
        applyGlobalTheme(getStoredTheme() === 'dark');
        ensureFloatingButtons();
        syncNavigationState();
        syncAuthUI();
        initFirebaseForStaticPages();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    // Listen for storage events across tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'class_caddy_theme' || e.key === 'studyPlanSettings') {
            applyGlobalTheme(getStoredTheme() === 'dark');
        }
        if (e.key === 'cc_auth_user' || e.key === 'class_caddy_user') {
            syncAuthUI();
        }
    });
})();
// ===== END: GLOBAL DARK MODE, SCROLL TOGGLE & UNIVERSAL AUTH SYNC =====
