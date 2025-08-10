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
});