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
     * 6. Header Scroll Effect Logic (Disabled: Universal Study Plan Header stays pinned)
     * ========================================================================== */

    /* ==========================================================================
     * 7. Mobile Navigation Logic
     * ========================================================================== */
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileAcademicButton = document.getElementById('mobile-academic-button');
    const mobileAcademicMenu = document.getElementById('mobile-academic-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.onclick = () => {
            mobileMenu.classList.toggle('hidden');
        };
    }

    if (mobileAcademicButton && mobileAcademicMenu) {
        mobileAcademicButton.onclick = () => {
            mobileAcademicMenu.classList.toggle('hidden');
            const arrowIcon = mobileAcademicButton.querySelector('svg');
            if (arrowIcon) {
                arrowIcon.classList.toggle('rotate-180');
            }
        };
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

	function setupKaraoke(timings) {
		const audio = document.getElementById('audio-source');
		const lines = Array.from(document.querySelectorAll('tbody tr[id^="line-"]'));
		let currentHighlight = null;

		if (!audio || lines.length === 0) {
			return;
		}

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
				if (currentHighlight) {
					currentHighlight.classList.remove('highlight');
				}
				activeLine.classList.add('highlight');
				currentHighlight = activeLine;

				currentHighlight.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
		});

		audio.addEventListener('ended', function() {
			if (currentHighlight) {
				currentHighlight.classList.remove('highlight');
				currentHighlight = null;
			}
		});
	}

/* ==========================================================================
 * 10. Auto-scroll to Academic Courses on Index Page (Removed per redesign)
 * ========================================================================== */

/* ==========================================================================
 * 11. Auto-scroll to Course Contents on Course Pages
 * ========================================================================== */
const courseContentsSection = document.getElementById('course-contents');
if (courseContentsSection) {
    setTimeout(() => {
        courseContentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

/* ==========================================================================
 * 12. Make all download links open in a new tab
 * ========================================================================== */
const downloadButtons = document.querySelectorAll('.download-btn');
downloadButtons.forEach(button => {
    button.setAttribute('target', '_blank');
    button.setAttribute('rel', 'noopener noreferrer');
});

if (typeof lineTimings !== 'undefined') {
    setupKaraoke(lineTimings);
}
});

// ===== START: SMOOTH SCROLL SCRIPT =====
document.addEventListener('DOMContentLoaded', () => {
    const scrollLinks = document.querySelectorAll('a[href^="index.html#"], a[href^="/index.html#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const onHomePage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
            const hash = this.hash;

            if (onHomePage && hash) {
                e.preventDefault();
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});
// ===== END: SMOOTH SCROLL SCRIPT =====

// ===== START: UNIVERSAL STUDY PLAN HEADER, FLOATING BUTTONS & AUTH ENGINE =====
(function () {
    const googleSvgData = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Zz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ij48L3BhdGg+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDMS4yNSAxNi4xMyAwIDIwLjA4IDAgMjRjMCAzLjkyIDEuMjUgNy44NyAyLjk5IDEwLjk4bDcuNTQtNS45OXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMzRBMDMyIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ij48L3BhdGg+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgweiI+PC9wYXRoPjwvZz48L3N2Zz4=";

    function isInsideInternalReaderIframe() {
        try {
            if (window.self !== window.top && window.parent && window.parent.document) {
                if (window.parent.document.getElementById('doc-iframe')) {
                    return true;
                }
            }
        } catch (e) {}
        return false;
    }

    function isStudyPlanPage() {
        const path = (window.location.pathname || '').toLowerCase();
        return path.includes('study_plan') || path.includes('study-plan');
    }

    // 0. Inject Self-Contained Universal CSS (Matches study_plan.html & study-plan-styles.css 100%)
    function ensureUniversalStylesAndIcons() {
        // Ensure FontAwesome is loaded so fa-moon / fa-sun / fa-arrow-down / fa-arrow-up always render
        const hasFontAwesome = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(
            (l) => (l.href || '').includes('font-awesome') || (l.href || '').includes('fontawesome')
        );
        if (!hasFontAwesome && document.head) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(faLink);
        }

        if (!document.getElementById('cc-universal-ui-styles') && document.head) {
            const style = document.createElement('style');
            style.id = 'cc-universal-ui-styles';
            style.textContent = `
                /* Universal Study Plan Header Protection & Fallback Layout (Works with or without Tailwind) */
                header.main-website-ui {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    z-index: 50 !important;
                    background: rgba(255, 255, 255, 0.95) !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    text-align: left !important;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }
                html.dark header.main-website-ui,
                body.dark-mode header.main-website-ui {
                    background: rgba(17, 24, 39, 0.95) !important;
                    border-bottom-color: #1f2937 !important;
                }
                header.main-website-ui::before,
                header.main-website-ui::after {
                    display: none !important;
                    content: none !important;
                }
                header.main-website-ui > .container {
                    max-width: 1280px !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                    padding: 0.75rem 1.5rem !important;
                    box-sizing: border-box !important;
                }
                header.main-website-ui nav {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    width: 100% !important;
                }
                header.main-website-ui .cc-brand-left {
                    display: flex !important;
                    align-items: center !important;
                    gap: 1rem !important;
                    min-width: 0 !important;
                }
                header.main-website-ui a {
                    text-decoration: none !important;
                }
                header.main-website-ui h1 {
                    font-size: 1.25rem !important;
                    line-height: 1.75rem !important;
                    font-weight: 700 !important;
                    color: #1f2937 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: none !important;
                    -webkit-text-fill-color: unset !important;
                    letter-spacing: normal !important;
                }
                html.dark header.main-website-ui h1,
                body.dark-mode header.main-website-ui h1 {
                    color: #f9fafb !important;
                }
                header.main-website-ui img.cc-avatar-founder {
                    width: 40px !important;
                    height: 40px !important;
                    border-radius: 9999px !important;
                    border: 2px solid #10b981 !important;
                    object-fit: cover !important;
                    display: block !important;
                }
                header.main-website-ui img[alt="DU Logo"] {
                    width: 40px !important;
                    height: 40px !important;
                    border-radius: 9999px !important;
                    border: 1px solid #e5e7eb !important;
                    object-fit: cover !important;
                    display: block !important;
                }
                html.dark header.main-website-ui img[alt="DU Logo"],
                body.dark-mode header.main-website-ui img[alt="DU Logo"] {
                    border-color: #374151 !important;
                }
                header.main-website-ui #header-desktop-nav-tabs {
                    display: none;
                    align-items: center !important;
                    gap: 0.25rem !important;
                    background-color: #f3f4f6 !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 9999px !important;
                    padding: 0.25rem !important;
                    font-size: 0.875rem !important;
                }
                html.dark header.main-website-ui #header-desktop-nav-tabs,
                body.dark-mode header.main-website-ui #header-desktop-nav-tabs {
                    background-color: #1f2937 !important;
                    border-color: #374151 !important;
                }
                header.main-website-ui #header-desktop-nav-tabs a {
                    padding: 0.375rem 1.25rem !important;
                    border-radius: 9999px !important;
                    font-size: 0.875rem !important;
                    line-height: 1.25rem !important;
                    transition: all 0.15s ease !important;
                    color: #4b5563;
                    display: inline-block !important;
                }
                html.dark header.main-website-ui #header-desktop-nav-tabs a,
                body.dark-mode header.main-website-ui #header-desktop-nav-tabs a {
                    color: #d1d5db;
                }
                header.main-website-ui #header-desktop-nav-tabs a:hover {
                    background-color: #e5e7eb;
                    color: #111827;
                }
                html.dark header.main-website-ui #header-desktop-nav-tabs a:hover,
                body.dark-mode header.main-website-ui #header-desktop-nav-tabs a:hover {
                    background-color: #374151;
                    color: #ffffff;
                }
                header.main-website-ui #header-desktop-nav-tabs a.cc-nav-active,
                header.main-website-ui #header-desktop-nav-tabs a.bg-emerald-500 {
                    background-color: #10b981 !important;
                    color: #ffffff !important;
                    font-weight: 500 !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                }
                header.main-website-ui .cc-right-desktop {
                    display: none;
                    align-items: center !important;
                    gap: 1rem !important;
                }
                header.main-website-ui .cc-mobile-toggle-wrap {
                    display: flex;
                    align-items: center;
                }
                @media (min-width: 768px) {
                    header.main-website-ui #header-desktop-nav-tabs {
                        display: flex !important;
                    }
                    header.main-website-ui .cc-right-desktop {
                        display: flex !important;
                    }
                    header.main-website-ui .cc-mobile-toggle-wrap,
                    header.main-website-ui #mobile-menu {
                        display: none !important;
                    }
                }
                header.main-website-ui #auth-container-desktop p,
                header.main-website-ui #auth-container-mobile p {
                    margin: 0 !important;
                    line-height: 1.3 !important;
                }
                header.main-website-ui #auth-container-desktop p.font-semibold,
                header.main-website-ui #auth-container-mobile p.font-semibold {
                    font-weight: 600 !important;
                    font-size: 0.875rem !important;
                    color: #374151 !important;
                }
                header.main-website-ui #auth-container-desktop p.text-xs,
                header.main-website-ui #auth-container-mobile p.text-xs {
                    font-size: 0.75rem !important;
                    color: #6b7280 !important;
                }
                html.dark header.main-website-ui #auth-container-desktop p.font-semibold,
                body.dark-mode header.main-website-ui #auth-container-desktop p.font-semibold,
                html.dark header.main-website-ui #auth-container-mobile p.font-semibold,
                body.dark-mode header.main-website-ui #auth-container-mobile p.font-semibold {
                    color: #e5e7eb !important;
                }
                html.dark header.main-website-ui #auth-container-desktop p.text-xs,
                body.dark-mode header.main-website-ui #auth-container-desktop p.text-xs,
                html.dark header.main-website-ui #auth-container-mobile p.text-xs,
                body.dark-mode header.main-website-ui #auth-container-mobile p.text-xs {
                    color: #9ca3af !important;
                }
                header.main-website-ui #header-signin-btn,
                header.main-website-ui #mobile-signin-btn {
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 0.75rem !important;
                    padding: 0.5rem 1rem !important;
                    background-color: #ffffff !important;
                    color: #374151 !important;
                    border: 1px solid #d1d5db !important;
                    border-radius: 9999px !important;
                    font-size: 0.875rem !important;
                    font-weight: 500 !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                    cursor: pointer !important;
                    transition: background-color 0.15s ease !important;
                }
                header.main-website-ui #mobile-signin-btn {
                    justify-content: center !important;
                    width: 100% !important;
                }
                header.main-website-ui #header-signin-btn:hover,
                header.main-website-ui #mobile-signin-btn:hover {
                    background-color: #f9fafb !important;
                }
                html.dark header.main-website-ui #header-signin-btn,
                body.dark-mode header.main-website-ui #header-signin-btn,
                html.dark header.main-website-ui #mobile-signin-btn,
                body.dark-mode header.main-website-ui #mobile-signin-btn {
                    background-color: #1f2937 !important;
                    color: #e5e7eb !important;
                    border-color: #374151 !important;
                }
                header.main-website-ui #header-signin-btn img,
                header.main-website-ui #mobile-signin-btn img {
                    width: 20px !important;
                    height: 20px !important;
                    display: inline-block !important;
                }
                header.main-website-ui #mobile-menu.hidden {
                    display: none !important;
                }
                header.main-website-ui #mobile-menu:not(.hidden) {
                    display: block !important;
                    background-color: #ffffff !important;
                    border-top: 1px solid #e5e7eb !important;
                    margin: 0.75rem -1.5rem 0 -1.5rem !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                }
                html.dark header.main-website-ui #mobile-menu:not(.hidden),
                body.dark-mode header.main-website-ui #mobile-menu:not(.hidden) {
                    background-color: #111827 !important;
                    border-top-color: #1f2937 !important;
                }
                header.main-website-ui #mobile-menu a {
                    display: block !important;
                    padding: 0.75rem 1.5rem !important;
                    font-size: 0.875rem !important;
                    color: #374151 !important;
                }
                html.dark header.main-website-ui #mobile-menu a,
                body.dark-mode header.main-website-ui #mobile-menu a {
                    color: #d1d5db !important;
                }
                header.main-website-ui #mobile-menu a.cc-mobile-active {
                    color: #059669 !important;
                    background-color: #ecfdf5 !important;
                    font-weight: 600 !important;
                }
                html.dark header.main-website-ui #mobile-menu a.cc-mobile-active,
                body.dark-mode header.main-website-ui #mobile-menu a.cc-mobile-active {
                    color: #34d399 !important;
                    background-color: rgba(6, 78, 59, 0.4) !important;
                }

                /* Universal Study Plan Floating Action Buttons (#scroll-toggle-btn & #global-dark-mode-btn) */
                #scroll-toggle-btn {
                    position: fixed !important;
                    bottom: 128px !important; /* 8rem / bottom-32 */
                    right: 20px !important;   /* 1.25rem / right-5 */
                    width: 48px !important;   /* w-12 */
                    height: 48px !important;  /* h-12 */
                    background-color: #374151 !important; /* bg-gray-700 */
                    color: #ffffff !important;
                    border-radius: 9999px !important;
                    border: none !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
                    z-index: 100 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    opacity: 0.9 !important;
                    transition: all 0.3s ease !important;
                    padding: 0 !important;
                }
                #scroll-toggle-btn:hover {
                    background-color: #111827 !important; /* hover:bg-gray-900 */
                    transform: scale(1.1) !important;
                    opacity: 1 !important;
                }
                #scroll-toggle-btn i {
                    font-size: 1rem !important;
                    color: #ffffff !important;
                }

                #global-dark-mode-btn {
                    position: fixed !important;
                    bottom: 75px !important;  /* Matches study-plan-styles.css line 3230 */
                    right: 20px !important;   /* right-5 */
                    width: 44px !important;   /* Matches study-plan-styles.css line 3228 */
                    height: 44px !important;  /* Matches study-plan-styles.css line 3229 */
                    background-color: #1f2937 !important; /* bg-gray-800 */
                    color: #facc15 !important; /* text-yellow-400 */
                    border: 2px solid #374151 !important; /* border-gray-700 */
                    border-radius: 9999px !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
                    z-index: 999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease !important;
                    padding: 0 !important;
                }
                #global-dark-mode-btn:hover {
                    transform: scale(1.1) !important;
                }
                #global-dark-mode-btn i {
                    font-size: 1.1rem !important; /* Matches study-plan-styles.css line 3233 */
                    line-height: 1 !important;
                }
                html.dark #global-dark-mode-btn,
                body.dark-mode #global-dark-mode-btn {
                    background-color: #fbbf24 !important; /* Yellow Sun — study-plan-styles.css line 2659 */
                    color: #1f2937 !important;            /* Dark Icon — study-plan-styles.css line 2660 */
                    border-color: #f59e0b !important;     /* study-plan-styles.css line 2661 */
                }
                html.dark #global-dark-mode-btn i,
                body.dark-mode #global-dark-mode-btn i {
                    color: #1f2937 !important;
                }
                html.dark #global-dark-mode-btn i::before,
                body.dark-mode #global-dark-mode-btn i::before {
                    content: "\\f185" !important; /* Switch Moon to Sun Icon — study-plan-styles.css line 2664 */
                }

                @media (max-width: 414px) {
                    #scroll-toggle-btn {
                        right: 10px !important;
                        bottom: 130px !important;
                        width: 40px !important;
                        height: 40px !important;
                    }
                    #global-dark-mode-btn {
                        right: 10px !important;
                        bottom: 70px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function isMainReactApp() {
        return !!document.querySelector('script[src*="/src/main.tsx"]');
    }

    // 1. Universal Global Header Replacement / Injection (Matches study_plan.html 100%)
    function ensureUniversalHeader() {
        // Skip if main React app manages the page (/src/main.tsx) or if inside Archives internal reader iframe or on study_plan.html itself
        if (isMainReactApp() || isInsideInternalReaderIframe() || isStudyPlanPage()) {
            return;
        }

        // Preserve homepage language switchers if present on index.html
        const existingLangDesktop = document.getElementById('header-lang-switcher');
        const existingLangMobile = document.getElementById('mobile-lang-switcher');
        const langDesktopHTML = existingLangDesktop ? existingLangDesktop.outerHTML : '';
        const langMobileHTML = existingLangMobile ? existingLangMobile.outerHTML : '';

        const canonicalHeaderInner = `
        <div class="container mx-auto px-4 sm:px-6 py-3">
            <nav class="flex justify-between items-center">
                <div class="cc-brand-left flex items-center gap-3 sm:gap-4 min-w-0">
                    <a href="https://facebook.com/emammehedi17" target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
                        <img src="/images/profile.jpg" alt="Profile" class="cc-avatar-founder h-10 w-10 rounded-full border-2 border-emerald-500 object-cover" onerror="this.onerror=null; this.src='https://placehold.co/40x40/ffffff/059669?text=CC';">
                    </a>
                    <a href="/index.html">
                        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Class Caddy</h1>
                    </a>
                </div>
                <!-- Center: Desktop Navigation -->
                <div id="header-desktop-nav-tabs" class="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-sm">
                    <a href="/index.html" class="px-5 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">Home</a>
                    <a href="/archives.html" class="px-5 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">Archives</a>
                    <a href="/study_plan.html" class="px-5 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">Study Plan</a>
                    <a href="/about.html" class="px-5 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">About</a>
                    <a href="/contact.html" class="px-5 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">Contact</a>
                </div>
                <!-- Right: Language Switcher (on Homepage), DU Logo / User Photo & Auth Container -->
                <div class="cc-right-desktop hidden md:flex items-center gap-4">
                    ${langDesktopHTML}
                    <a href="https://du.ac.bd/" target="_blank" rel="noopener noreferrer">
                        <img src="/images/du_logo.png" alt="DU Logo" class="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover" onerror="this.onerror=null; this.src='https://placehold.co/40x40/eeeeee/111827?text=DU';">
                    </a>
                    <div id="auth-container-desktop" class="auth-container text-sm"></div>
                </div>
                <!-- Mobile Menu Toggle Button -->
                <div class="cc-mobile-toggle-wrap md:hidden flex items-center">
                    <button id="mobile-menu-button" type="button" aria-label="Toggle Menu" class="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none">
                        <svg class="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </div>
            </nav>
            <div id="mobile-menu" class="hidden md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 mt-3 shadow-md">
                <a href="/index.html" class="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Home</a>
                <a href="/archives.html" class="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Archives</a>
                <a href="/study_plan.html" class="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Study Plan</a>
                <a href="/about.html" class="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">About</a>
                <a href="/contact.html" class="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Contact</a>
                ${langMobileHTML}
                <div id="auth-container-mobile" class="auth-container px-6 py-4 border-t border-gray-200 dark:border-gray-800"></div>
            </div>
        </div>`;

        // Find existing website header (either header.main-website-ui or top-level nav header)
        let targetHeader = document.querySelector('header.main-website-ui');
        if (!targetHeader) {
            const firstHeader = document.querySelector('body > header');
            if (firstHeader && (firstHeader.querySelector('nav') || firstHeader.textContent.includes('Class Caddy'))) {
                targetHeader = firstHeader;
            }
        }

        if (targetHeader) {
            targetHeader.className = 'fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 main-website-ui shadow-sm';
            targetHeader.innerHTML = canonicalHeaderInner;
        } else if (document.body) {
            const newHeader = document.createElement('header');
            newHeader.className = 'fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 main-website-ui shadow-sm';
            newHeader.innerHTML = canonicalHeaderInner;
            document.body.insertBefore(newHeader, document.body.firstChild);
            // Ensure body has top padding clearance if a header was freshly injected onto a standalone note page
            const currentPaddingTop = parseInt(window.getComputedStyle(document.body).paddingTop || '0', 10);
            if (currentPaddingTop < 64) {
                document.body.style.paddingTop = '80px';
            }
        }

        // Re-bind mobile menu toggle button
        const mobileMenuBtn = document.getElementById('mobile-menu-button');
        const mobileMenuEl = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenuEl) {
            mobileMenuBtn.onclick = () => {
                mobileMenuEl.classList.toggle('hidden');
            };
        }
    }

    // 2. Universal Theme Manager
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
            document.body?.classList.add('dark-mode');
            document.documentElement.classList.add('dark');
        } else {
            document.body?.classList.remove('dark-mode');
            document.documentElement.classList.remove('dark');
        }

        const darkBtn = document.getElementById('global-dark-mode-btn');
        if (darkBtn) {
            // Study Plan uses <i class="fas fa-moon text-2xl"></i> and CSS switches ::before to \f185 in dark-mode
            darkBtn.innerHTML = '<i class="fas fa-moon text-2xl"></i>';
            darkBtn.title = 'Toggle Dark Mode';
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
        document.body?.classList.add('dark-mode');
    }

    // 3. Ensure Study Plan's Exact Two Floating Action Buttons exist on DOM & remove legacy duplicates
    function ensureFloatingButtons() {
        if (isMainReactApp() || isInsideInternalReaderIframe()) {
            return;
        }

        // Remove any page-specific legacy back-to-top buttons so only Study Plan's 2 universal buttons appear
        document.querySelectorAll('.go-to-top-btn, #back-to-top, .back-to-top, #backToTop').forEach((el) => {
            el.remove();
        });
        const oldGoToTop = document.getElementById('go-to-top-btn');
        if (oldGoToTop && !oldGoToTop.closest('#action-buttons-container')) {
            oldGoToTop.remove();
        }

        // 1) Scroll Toggle Button — Exact Study Plan markup & classes
        let scrollBtn = document.getElementById('scroll-toggle-btn');
        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.id = 'scroll-toggle-btn';
            document.body.appendChild(scrollBtn);
        }
        scrollBtn.className = 'fixed bottom-32 right-5 z-[100] w-12 h-12 bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-900 hover:scale-110 focus:outline-none opacity-90 hover:opacity-100';
        scrollBtn.title = 'Scroll';
        if (!scrollBtn.querySelector('i')) {
            scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        }

        if (!isStudyPlanPage()) {
            const updateScrollIcon = () => {
                const icon = scrollBtn.querySelector('i');
                if (!icon) return;
                const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                if (scrollPos >= 300) {
                    icon.className = 'fas fa-arrow-up';
                    scrollBtn.title = 'Scroll to Top';
                } else {
                    icon.className = 'fas fa-arrow-down';
                    scrollBtn.title = 'Scroll to Bottom';
                }
            };

            window.removeEventListener('scroll', updateScrollIcon);
            window.addEventListener('scroll', updateScrollIcon, { passive: true });
            updateScrollIcon();

            scrollBtn.onclick = (e) => {
                if (e) e.preventDefault();
                const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                if (scrollPos < 300) {
                    const maxScroll = Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight
                    );
                    window.scrollTo({ top: maxScroll, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
        }

        // 2) Global Dark Mode Button — Exact Study Plan markup & classes
        let darkBtn = document.getElementById('global-dark-mode-btn');
        if (!darkBtn) {
            darkBtn = document.createElement('button');
            darkBtn.id = 'global-dark-mode-btn';
            document.body.appendChild(darkBtn);
        }
        darkBtn.className = 'fixed bottom-6 right-5 w-14 h-14 bg-gray-800 text-yellow-400 rounded-full shadow-lg border-2 border-gray-700 z-[999] flex items-center justify-center hover:scale-110 transition-transform';
        darkBtn.title = 'Toggle Dark Mode';
        darkBtn.innerHTML = '<i class="fas fa-moon text-2xl"></i>';

        if (!isStudyPlanPage()) {
            darkBtn.onclick = (e) => {
                if (e) e.preventDefault();
                window.toggleGlobalTheme();
            };
        }
    }

    // 4. Dynamic Navigation Active-Tab Highlighting
    function syncNavigationState() {
        const path = (window.location.pathname || '').toLowerCase();
        let activePage = 'archives';
        if (path.includes('study_plan') || path.includes('study-plan')) {
            activePage = 'study_plan';
        } else if (path.includes('about')) {
            activePage = 'about';
        } else if (path.includes('contact')) {
            activePage = 'contact';
        } else if (path.endsWith('/index.html') || path === '/' || path === '') {
            activePage = 'home';
        } else {
            // Archives & all notes/courses/grammar/poets inside Archives highlight Archives
            activePage = 'archives';
        }

        const desktopNavLinks = document.querySelectorAll('#header-desktop-nav-tabs a, header.main-website-ui nav div.md\\:flex a');
        desktopNavLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (link.closest('#auth-container-desktop') || link.closest('#auth-container-mobile') || link.closest('#header-lang-switcher') || href.includes('facebook') || href.includes('du.ac.bd') || link.querySelector('img')) {
                return;
            }
            const isMatch =
                (activePage === 'home' && (href.endsWith('index.html') || href === '/')) ||
                (activePage === 'archives' && href.includes('archives.html')) ||
                (activePage === 'study_plan' && href.includes('study_plan')) ||
                (activePage === 'about' && href.includes('about')) ||
                (activePage === 'contact' && href.includes('contact'));

            link.classList.remove('bg-emerald-500', 'text-white', 'font-medium', 'shadow-sm', 'cc-nav-active', 'text-gray-600', 'dark:text-gray-300');

            if (isMatch) {
                link.classList.add('bg-emerald-500', 'text-white', 'font-medium', 'shadow-sm', 'cc-nav-active');
            } else {
                link.classList.add('text-gray-600', 'dark:text-gray-300');
            }
        });

        const mobileLinks = document.querySelectorAll('#mobile-menu > a');
        mobileLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            const isMatch =
                (activePage === 'home' && (href.endsWith('index.html') || href === '/')) ||
                (activePage === 'archives' && href.includes('archives')) ||
                (activePage === 'study_plan' && href.includes('study_plan')) ||
                (activePage === 'about' && href.includes('about')) ||
                (activePage === 'contact' && href.includes('contact'));

            link.classList.remove('text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/40', 'font-semibold', 'cc-mobile-active', 'text-gray-700', 'dark:text-gray-300');
            if (isMatch) {
                link.classList.add('text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/40', 'font-semibold', 'cc-mobile-active');
            } else {
                link.classList.add('text-gray-700', 'dark:text-gray-300');
            }
        });
    }

    // 5. Firebase Google Sign-In Initialization for Static Pages
    let firebaseAuthInstance = null;
    let googleAuthProvider = null;
    let isFirebaseLoaded = false;

    async function initFirebaseForStaticPages() {
        if (isFirebaseLoaded || window._fb_auth_initialized || isStudyPlanPage()) return;
        try {
            const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
            const { getAuth, onAuthStateChanged, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');

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

    // 6. Universal Auth UI Synchronization — Exact Study Plan Header Format (app.js lines 674-772)
    function syncAuthUI() {
        if (isStudyPlanPage() || isMainReactApp()) return;

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
                            displayName: parsed.name || parsed.displayName || 'User',
                            email: parsed.email || '',
                            photoURL: parsed.photoURL || parsed.avatar || null
                        };
                    }
                }
            } catch (e) {}
        }

        const headerLogo = document.querySelector('header.main-website-ui img[alt="DU Logo"]');
        const headerLink = headerLogo ? headerLogo.closest('a') : null;
        const authDesktop = document.getElementById('auth-container-desktop');
        const authMobile = document.getElementById('auth-container-mobile');

        if (user && user.isLoggedIn) {
            const displayName = user.displayName || user.name || user.email?.split('@')[0] || 'User';

            // Exact Study Plan behavior: replace DU Logo with user's Google profile photo when logged in
            if (user.photoURL && headerLogo) {
                headerLogo.src = user.photoURL;
                if (headerLink) headerLink.removeAttribute('href');
            }

            const loggedInHTML = `<div class="text-sm"><p class="font-semibold text-gray-700 dark:text-gray-200">${displayName}</p><p class="text-gray-500 dark:text-gray-400 text-xs">${user.email || ''}</p></div>`;

            if (authDesktop) authDesktop.innerHTML = loggedInHTML;
            if (authMobile) authMobile.innerHTML = loggedInHTML;
        } else {
            // Exact Study Plan behavior: restore DU Logo when logged out
            if (headerLogo) {
                headerLogo.src = '/images/du_logo.png';
                if (headerLink) headerLink.href = 'https://du.ac.bd/';
            }

            const loggedOutHTML = `
                <button id="header-signin-btn" type="button" onclick="window.triggerGoogleSignInGlobal()" class="flex items-center gap-3 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full transition-colors text-sm font-medium shadow-sm cursor-pointer">
                    <img src="${googleSvgData}" alt="G" class="w-5 h-5">
                    <span>Sign in</span>
                </button>`;

            const mobileLoggedOutHTML = loggedOutHTML
                .replace('id="header-signin-btn"', 'id="mobile-signin-btn"')
                .replace('flex items-center', 'flex items-center justify-center w-full');

            if (authDesktop) authDesktop.innerHTML = loggedOutHTML;
            if (authMobile) authMobile.innerHTML = mobileLoggedOutHTML;
        }
    }

    function initAll() {
        ensureUniversalStylesAndIcons();
        ensureUniversalHeader();
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

    window.addEventListener('storage', (e) => {
        if (e.key === 'class_caddy_theme' || e.key === 'studyPlanSettings') {
            applyGlobalTheme(getStoredTheme() === 'dark');
        }
        if (e.key === 'cc_auth_user' || e.key === 'class_caddy_user') {
            syncAuthUI();
        }
    });
})();
// ===== END: UNIVERSAL STUDY PLAN HEADER, FLOATING BUTTONS & AUTH ENGINE =====

