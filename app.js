
        // Import necessary functions from Firebase SDK
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithCustomToken, signInAnonymously, getRedirectResult, signInWithRedirect } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, setDoc, doc, getDoc, collection, query, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, Timestamp, where, orderBy, setLogLevel, documentId, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
		
        // --- Firebase Configuration ---
        setLogLevel('debug'); // Keep debug logging enabled for now

        // PASTE YOUR ACTUAL FIREBASE CONFIG HERE:
        const firebaseConfig = {
          apiKey: "AIzaSyAj7MDnrnzKUO73BXG0jeM-uBGrAH3XiAY", // <-- YOUR ACTUAL KEY
          authDomain: "study-plan17.firebaseapp.com", // <-- YOURS
          projectId: "study-plan17", // <-- YOURS
          storageBucket: "study-plan17.appspot.com", // <-- YOURS
          messagingSenderId: "394648483332", // <-- YOURS
          appId: "1:394648483332:web:31c0d7a8b3f7065ce4e751", // <-- YOURS
          measurementId: "G-61TH4D55J3" // <-- YOURS (Optional)
        };

        const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId; // Use projectId as fallback app identifier if __app_id is missing

        console.log("Using manually added Firebase config:", firebaseConfig); // Log that manual config is used


        // Initialize Firebase
        let app;
        let auth;
        let db;
        let googleProvider;

        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            
            // --- NEW: ENABLE OFFLINE PERSISTENCE ---
            enableIndexedDbPersistence(db)
                .catch((err) => {
                    if (err.code == 'failed-precondition') {
                        console.log('Persistence failed: Multiple tabs open.');
                    } else if (err.code == 'unimplemented') {
                        console.log('Persistence not supported by this browser.');
                    }
                });
            // ---------------------------------------

            googleProvider = new GoogleAuthProvider();
            console.log("Firebase initialized successfully.");
        } catch (error) {
            console.error("CRITICAL ERROR initializing Firebase:", error);
            console.error("Firebase Config Used:", firebaseConfig);
             const authSection = document.getElementById('auth-section');
             if(authSection) authSection.innerHTML = `<p class="text-red-500 font-bold text-center">Error: Could not initialize Firebase. Please check the console.</p>`;
             throw new Error("Firebase initialization failed.");
        }
        // --- End Firebase Configuration ---

        // --- DOM Elements ---
        const authSection = document.getElementById('auth-section');
        const loginPrompt = document.getElementById('login-prompt');
        const userInfo = document.getElementById('user-info');
        const userDisplay = document.getElementById('user-display');
        const userEmailDisplay = document.getElementById('user-email-display');
        const userIdDisplay = document.getElementById('user-id-display');
		const userPhotoDisplay = document.getElementById('user-photo-display');
        const googleLoginBtn = document.getElementById('google-login-btn');
		const guestLoginBtn = document.getElementById('guest-login-btn');
        const logoutBtn = document.getElementById('logout-btn'); // Main logout button
        const studyPlanContent = document.getElementById('study-plan-content');
        const addMonthBtn = document.getElementById('add-month-btn');
        const monthNavButtonsContainer = document.getElementById('month-nav-buttons');
        const currentMonthPlanDisplay = document.getElementById('current-month-plan-display');
        const noPlansMessage = document.getElementById('no-plans-message');
        const selectMonthMessage = document.getElementById('select-month-message');
        const syncStatusText = document.getElementById('sync-status-text');
		const showAllVocabBtn = document.getElementById('show-all-vocab-btn');

        const authContainerDesktop = document.getElementById('auth-container-desktop');
        const authContainerMobile = document.getElementById('auth-container-mobile');
		let activeWeeksDataCache = {};

        // Header navigation elements
        const pageHeader = document.querySelector('header.main-website-ui');
        const academicDropdown = document.getElementById('academic-dropdown');
        const academicMenu = document.getElementById('academic-menu');
        const academicButton = document.getElementById('academic-button');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileAcademicButton = document.getElementById('mobile-academic-button');
        const mobileAcademicMenu = document.getElementById('mobile-academic-menu');

        // Modals
        const storyModal = document.getElementById('story-modal');
        const editStoryModal = document.getElementById('edit-story-modal');
        const saveStoryBtn = document.getElementById('save-story-btn');
        const confirmModal = document.getElementById('confirm-modal');
        const confirmModalTitle = document.getElementById('confirm-modal-title');
        const confirmModalMessage = document.getElementById('confirm-modal-message');
        const confirmModalConfirmBtn = document.getElementById('confirm-modal-confirm');
        const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel');
		const addMonthModal = document.getElementById('add-month-modal');
        const newMonthSelect = document.getElementById('new-month-select');
        const newMonthYear = document.getElementById('new-month-year');
        const saveNewMonthBtn = document.getElementById('save-new-month-btn');
		// --- START: ADD THESE QUIZ ELEMENTS ---
        const quizModal = document.getElementById('quiz-modal');
		const banglaRegex = /[\u0980-\u09FF]/; // Bengali Unicode Range
        const quizStartScreen = document.getElementById('quiz-start-screen');
        const quizStartMessage = document.getElementById('quiz-start-message');
        let quizStartBtn = document.getElementById('quiz-start-btn');
		const quizTitle = document.getElementById('quiz-title');
        const quizMainScreen = document.getElementById('quiz-main-screen');
        const quizQuestionArea = document.getElementById('quiz-question-area'); // <-- ADD THIS
        
        // --- MODIFIED: Moved listener to the new wrapper ---
        quizQuestionArea.addEventListener('animationend', () => {
            quizQuestionArea.classList.remove('slide-in-right', 'slide-in-left');
        });
        // --- END MODIFIED ---
        const quizQuestionNumber = document.getElementById('quiz-question-number');
        const quizScoreEl = document.getElementById('quiz-score');
        const quizQuestionText = document.getElementById('quiz-question-text');
        const quizOptionsContainer = document.getElementById('quiz-options-container');
        const quizNextBtn = document.getElementById('quiz-next-btn');
		const quizPrevBtn = document.getElementById('quiz-prev-btn');
        const quizSkipBtn = document.getElementById('quiz-skip-btn');
        const quizResultsScreen = document.getElementById('quiz-results-screen');
        const quizFinalScore = document.getElementById('summary-final-score');
		const quizPercentage = document.getElementById('summary-percentage'); // <-- MODIFIED
        const quizRestartBtn = document.getElementById('quiz-restart-btn');
		// --- START: ADD THESE NEW ELEMENTS ---
        const quizReviewBtn = document.getElementById('quiz-review-btn');
        
        const quizReviewScreen = document.getElementById('quiz-review-screen');
        const quizReviewContent = document.getElementById('quiz-review-content');
        const quizBackToResultsBtn = document.getElementById('quiz-back-to-results-btn');
        // --- END: ADD THESE NEW ELEMENTS ---
		const saveBtn = document.getElementById('quiz-save-btn'); // <-- ADD THIS LINE
		
        
        let progressChart = null; // Holds the chart instance
		let currentQuizResultData = null; // <-- ADD THIS
		let savedResultsCache = null; // <-- ADD THIS, for caching results
        let currentUser = null;
        let userId = null;
        let unsubscribePlans = null; // For the list of month buttons
        let unsubscribeActiveMonth = null; // For the currently displayed month
        let currentStoryTarget = null;
        let currentConfirmAction = null;
        let currentVocabCodeTarget = null;
		let isCheckboxClickGlobal = null;
		let currentMcqTarget = null;
		let autosaveTimer = null;
		
		// --- START: GUEST MODE VARS ---
        const MEHEDI_UID = "0RngZmzJioaZB4XiKKvGB7lKlxv1"; // <-- PASTE YOUR UID
        let isGuestMode = false;
        // --- END: GUEST MODE VARS ---
		
		// --- START: ADD THESE QUIZ STATE VARIABLES ---
        let currentVocabData = []; // Renamed from currentQuizData
        let currentMcqData = []; // NEW variable for MCQ quizzes
		let currentOptionPool = null;
        let currentQuizQuestions = [];
        let currentQuizQuestionIndex = 0;
        let currentQuizScore = 0;
		let quizTimerInterval = null;
		let quizTotalSeconds = 0; // <-- এই লাইনটি যোগ করুন
        let quizRemainingSeconds = 0; // <-- এই লাইনটি যোগ করুন
		let quizStartTime = 0;
        // --- END: QUIZ STATE VARIABLES ---
		
		// --- START: ADD THESE ---
        let currentMonthDeleteTarget = null; // Stores {monthId, monthName}
        const deleteMonthConfirmModal = document.getElementById('delete-month-confirm-modal');
        const deleteMonthTitle = document.getElementById('delete-month-title');
        const deleteMonthChallengeText = document.getElementById('delete-month-challenge-text');
        const deleteMonthInput = document.getElementById('delete-month-input');
        const deleteMonthError = document.getElementById('delete-month-error');
        const deleteMonthCancelBtn = document.getElementById('delete-month-cancel-btn');
        const deleteMonthConfirmBtn = document.getElementById('delete-month-confirm-btn');
		// --- START: ADD THIS LISTENER ---
        // অ্যানিমেশন শেষ হলে 'modal-shake' ক্লাসটি স্বয়ংক্রিয়ভাবে রিমুভ করুন
        deleteMonthConfirmModal.querySelector('.modal-content').addEventListener('animationend', function() {
            this.classList.remove('modal-shake');
        });
        // --- END: ADD THIS LISTENER ---
        

        // --- Header Navigation & Scroll Logic (from script.js) ---
        if (pageHeader) {
            let lastScrollY = window.scrollY;
            // const headerHeight = pageHeader.offsetHeight; // <-- REMOVED FROM HERE

            window.addEventListener('scroll', () => {
                const headerHeight = pageHeader.offsetHeight || 65; // <-- ADDED HERE, INSIDE
                
                const currentScrollY = window.scrollY;
                let isHeaderHidden = pageHeader.classList.contains('header-hidden'); // Get current state

                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling DOWN: Hide header
                    pageHeader.classList.add('header-hidden');
                    isHeaderHidden = true;
                } else if (currentScrollY < lastScrollY || currentScrollY <= 0) {
                    // Scrolling UP (or at the top): Show header
                    pageHeader.classList.remove('header-hidden');
                    isHeaderHidden = false;
                }
                
                lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;

                // Update sticky progress bars
                const newTop = isHeaderHidden ? '0px' : `${headerHeight}px`;
                document.querySelectorAll('.sticky-progress-wrapper').forEach(bar => {
                    bar.style.top = newTop;
                });
            });
        }

        if (academicDropdown && academicMenu && academicButton) {
            let hideTimeout;
            const showMenu = () => { clearTimeout(hideTimeout); academicMenu.classList.remove('hidden'); };
            const hideMenu = () => { academicMenu.classList.add('hidden'); };
            const hideMenuWithDelay = () => { hideTimeout = setTimeout(hideMenu, 2000); };

            academicButton.addEventListener('click', (event) => {
                event.stopPropagation();
                academicMenu.classList.toggle('hidden');
            });
            academicDropdown.addEventListener('mouseenter', showMenu);
            academicDropdown.addEventListener('mouseleave', hideMenuWithDelay);
            window.addEventListener('click', (event) => {
                if (!academicDropdown.contains(event.target)) {
                    hideMenu();
                }
            });
        }

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
        // --- End Header Logic ---



		// --- START: ADD REDIRECT HANDLER ---
        // This runs on page load to "catch" a redirect login
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    // Successfully signed in from a redirect.
                    // onAuthStateChanged will now fire with this user.
                    console.log("Login successful (from redirect):", result.user);
                }
            }).catch((error) => {
                console.error("Google Redirect Sign-In Error:", error);
            });
        // --- END: ADD REDIRECT HANDLER ---
		
        // --- Authentication ---
        function updateAuthUI(user) {
             // --- START: TARGET HEADER LOGO ---
             const headerLogo = document.querySelector('img[alt="DU Logo"]');
             const headerLink = headerLogo ? headerLogo.closest('a') : null;
             // --- END: TARGET HEADER LOGO ---

             if (user) {
				 
				initSettingsSync(user.uid);
                // --- START: GUEST MODE LOGIC ---
                if (user.isAnonymous && user.uid === MEHEDI_UID) {
                    isGuestMode = true;
                } else {
                    isGuestMode = false; // Reset for real users
                }
                // --- END: GUEST MODE LOGIC ---

                currentUser = user;
                userId = user.uid; // This will be MEHEDI_UID in guest mode
                console.log("User logged in:", userId);
                console.log("Is Guest Mode:", isGuestMode); 

                loginPrompt.style.display = 'none';
                userInfo.classList.remove('hidden');
                userDisplay.textContent = user.displayName || 'User';
                userEmailDisplay.textContent = user.email || (user.isAnonymous ? 'Guest (Read-Only)' : ''); 
                userIdDisplay.textContent = `ID: ${userId}`;
				
                // Update the card profile pic (existing code)
				if (user.photoURL) {
                    userPhotoDisplay.src = user.photoURL;
                    userPhotoDisplay.classList.remove('hidden');
                    
                    // --- START: UPDATE HEADER LOGO TO USER PHOTO ---
                    if (headerLogo) {
                        headerLogo.src = user.photoURL; // Change logo to user photo
                        if (headerLink) headerLink.removeAttribute('href'); // Disable DU link
                    }
                    // --- END: UPDATE HEADER LOGO TO USER PHOTO ---
                } else {
                    userPhotoDisplay.classList.add('hidden');
                }
                userIdDisplay.title = 'Your unique User ID';

                // ... (Rest of your existing Login logic for buttons/headers) ...
                if (isGuestMode) {
                    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Exit Guest Mode'; 
                } else {
                    logoutBtn.innerHTML = 'Log Out'; 
                }
                logoutBtn.classList.remove('hidden');

                // --- START: REMOVE LOGOUT BUTTON FROM HEADER ---
                let loggedInHTML = '';
                if (isGuestMode) {
                    // Removed the 'Exit' button from here
                    loggedInHTML = `<div class="text-sm"><p class="font-semibold text-gray-700">Guest Mode</p><p class="text-gray-500 text-xs">Viewing Mehedi's Plan</p></div>`;
                } else {
                    // Removed the 'Log Out' button from here
                    loggedInHTML = `<div class="text-sm"><p class="font-semibold text-gray-700">${user.displayName || 'User'}</p><p class="text-gray-500 text-xs">${user.email || (user.isAnonymous ? 'Anonymous' : '')}</p></div>`;
                }
                
                authContainerDesktop.innerHTML = loggedInHTML;
                
                // Note: If you still want the button on MOBILE menu only, we can add it back here manually. 
                // For now, this removes it from both Desktop Header and Mobile Menu to be consistent.
                authContainerMobile.innerHTML = loggedInHTML; 
                // --- END: REMOVE LOGOUT BUTTON FROM HEADER ---

                // We can safely leave these listeners; the ?. check prevents errors if the buttons don't exist
                document.getElementById('logout-btn-header')?.addEventListener('click', handleLogout);
                document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout);

                studyPlanContent.classList.remove('hidden');
                loadStudyPlans();
            } else {
                // --- CRITICAL FIX: CLEAR DATA CACHE ON LOGOUT ---
                activeWeeksDataCache = {}; // Wipes the study plan data
                savedResultsCache = null;  // Wipes the quiz results data
                // ------------------------------------------------

                // --- START: GUEST MODE LOGIC (LOGOUT) ---
                isGuestMode = false;
                // --- END: GUEST MODE LOGIC ---
                currentUser = null;
                userId = null;
                console.log("User logged out");

                // --- START: RESET HEADER LOGO TO DU ---
                if (headerLogo) {
                    headerLogo.src = "images/du_logo.png"; // Revert to DU Logo
                    if (headerLink) headerLink.href = "https://du.ac.bd/"; // Restore DU Link
                }
                // --- END: RESET HEADER LOGO TO DU ---

                loginPrompt.style.display = 'block';
                userInfo.classList.add('hidden');
                logoutBtn.classList.add('hidden');
                
                userPhotoDisplay.classList.add('hidden');
                userPhotoDisplay.src = "";

                // --- START: GOOGLE BRANDED SIGN IN BUTTON ---
                const googleLogo = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Zz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ij48L3BhdGg+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDMS4yNSAxNi4xMyAwIDIwLjA4IDAgMjRjMCAzLjkyIDEuMjUgNy44NyAyLjk5IDEwLjk4bDcuNTQtNS45OXoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMzRBMDMyIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ij48L3BhdGg+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGg0OHY0OEgweiI+PC9wYXRoPjwvZz48L3N2Zz4=";

                const loggedOutHTML = `
                    <button id="header-signin-btn" class="flex items-center gap-3 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full transition-colors text-sm font-medium shadow-sm">
                        <img src="${googleLogo}" alt="G" class="w-5 h-5">
                        <span>Sign in</span>
                    </button>`;
                
                // For mobile, we adjust formatting to center it
                const mobileLoggedOutHTML = loggedOutHTML
                    .replace('id="header-signin-btn"', 'id="mobile-signin-btn"')
                    .replace('flex items-center', 'flex items-center justify-center w-full');

                authContainerDesktop.innerHTML = loggedOutHTML;
                authContainerMobile.innerHTML = mobileLoggedOutHTML;

                // Define the login trigger
                const triggerHeaderLogin = async () => {
                    try {
                        await signInWithPopup(auth, googleProvider);
                    } catch (error) {
                        console.error("Header Sign-In Error:", error);
                        showCustomAlert(`Sign-in error: ${error.code}`, "error");
                    }
                };

                // Attach listeners to the new buttons
                document.getElementById('header-signin-btn')?.addEventListener('click', triggerHeaderLogin);
                document.getElementById('mobile-signin-btn')?.addEventListener('click', triggerHeaderLogin);
                // --- END: GOOGLE BRANDED SIGN IN BUTTON ---
                studyPlanContent.classList.add('hidden');
                monthNavButtonsContainer.innerHTML = '';
                currentMonthPlanDisplay.innerHTML = '';
                noPlansMessage.style.display = 'block';
                 selectMonthMessage.classList.add('hidden');

                if (unsubscribePlans) unsubscribePlans();
                if (unsubscribeActiveMonth) unsubscribeActiveMonth();
                unsubscribePlans = null;
                unsubscribeActiveMonth = null;
            }
        }
		
        onAuthStateChanged(auth, async (user) => {
             console.log("Auth state changed. User:", user);
             if (user) {
                updateAuthUI(user);
             } else {
                 if (auth.currentUser) {
                     updateAuthUI(auth.currentUser);
                     return;
                 }
                 if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                     try {
                         await signInWithCustomToken(auth, __initial_auth_token);
                    } catch (error) {
                     console.error("Error signing in with custom token:", error);
                     updateAuthUI(null); // Show login prompt
					}
                 } else {
                     // No user and no custom token, show login prompt
                     updateAuthUI(null);
                 }
             }
        });

        googleLoginBtn.addEventListener('click', async () => { 
            try { 
                console.log("Using signInWithRedirect for all devices to avoid COOP error.");
                await signInWithPopup(auth, googleProvider);

            } catch (error) { 
                console.error("Google Sign-In Error:", error); 
                 showCustomAlert(`Sign-in error: ${error.code}`, "error");
            } 
        });
		
		guestLoginBtn.addEventListener('click', () => {
            isGuestMode = true;
            // Create a "fake" user object for the guest session
            const guestUser = {
                uid: MEHEDI_UID,
                displayName: "Guest (Viewing Mehedi's Plan)",
                email: "read-only@guest.com",
				photoURL: "images/profile.jpg",
                isAnonymous: true // Use this to check for guest mode
            };
            // Manually call updateAuthUI with this guest user
            updateAuthUI(guestUser);
        });
        async function handleLogout() { 
            try { 
                if (isGuestMode) {
                    // This is a guest, just reload the UI to the logged-out state
                    isGuestMode = false;
                    updateAuthUI(null); // This will reset everything
                } else {
                    // This is a real user, sign them out
                    if (unsubscribeActiveMonth) unsubscribeActiveMonth(); 
                    unsubscribeActiveMonth = null; 
                    await signOut(auth); 
                    console.log("Logout successful.");
                    // onAuthStateChanged will fire and call updateAuthUI(null)
                }
            } catch (error) { 
                console.error("Logout Error:", error); 
            } 
        }
		
        logoutBtn.addEventListener('click', handleLogout);

        // --- START: ADD MOBILE DETECT HELPER ---
        function isMobileDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        // --- END: ADD MOBILE DETECT HELPER ---
		
        // --- Firestore ---
        function getUserPlansCollectionPath() { if (!userId) throw new Error("User ID is not available."); return `artifacts/${appId}/users/${userId}/studyPlans`; }
		
		function getUserResultsCollectionPath() {
			if (!userId) throw new Error("User ID is not available.");
			return `artifacts/${appId}/users/${userId}/quizResults`;
		}

        // Load plans AND setup month navigation
        async function loadStudyPlans() {
            if (!currentUser || !userId) return;
            const plansCollectionPath = getUserPlansCollectionPath();
            const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc")); // Order by document ID (YYYY-MM)

            if (unsubscribePlans) unsubscribePlans();

            unsubscribePlans = onSnapshot(q, (querySnapshot) => {
                console.log("Received plans snapshot. Number of plans:", querySnapshot.size);
                monthNavButtonsContainer.innerHTML = '';
                // --- START: ADD THIS LINE ---
                const addMonthBtnHTML = isGuestMode ? '' : `<button id="add-month-btn-inline" class="action-button flex items-center gap-1.5"><i class="fas fa-plus-circle text-sm"></i> Add Month</button>`;
                // --- END: ADD THIS LINE ---

                let currentMonthElement = currentMonthPlanDisplay.querySelector('.card[data-month-id]');
                let currentMonthId = currentMonthElement ? currentMonthElement.dataset.monthId : null;
                let monthExists = false;

                // Save scroll position
                let scrollY = window.scrollY;
                let parentContainerRect = monthNavButtonsContainer.getBoundingClientRect();
                let shouldRestoreScroll = scrollY > (parentContainerRect.top + window.scrollY);

                if (querySnapshot.empty) {
                    currentMonthPlanDisplay.innerHTML = '';
                    noPlansMessage.style.display = 'block';
                    selectMonthMessage.classList.add('hidden');
                } else {
                    noPlansMessage.style.display = 'none';

                    querySnapshot.forEach((docSnap) => {
                        const monthId = docSnap.id;
                        if (monthId === currentMonthId) monthExists = true;
                        const monthData = docSnap.data();

                        const button = document.createElement('button');
                        button.textContent = monthData.monthName || monthId;
                        button.dataset.monthId = monthId;
                        button.classList.add('action-button', 'action-button-secondary', 'text-xs');
                        if (monthId === currentMonthId) {
                             button.classList.add('active-month');
                             button.classList.remove('action-button-secondary');
                        }
                        button.addEventListener('click', (e) => {
                            e.preventDefault(); // Prevent page jump
                            displayMonthPlan(monthId);
                        });
                        monthNavButtonsContainer.appendChild(button);
						
                    });
						

                    // --- MODIFIED BLOCK START ---
                    if (currentMonthId && !monthExists) {
                        // The month we were viewing was deleted. Show the 'select' message.
                        currentMonthPlanDisplay.innerHTML = '';
                        selectMonthMessage.classList.remove('hidden');
                        if (unsubscribeActiveMonth) unsubscribeActiveMonth(); // Stop listening to deleted month
                        unsubscribeActiveMonth = null;
                    } else if (!currentMonthId) {
                        // No month is currently selected (e.g., initial page load).
                        // Default to the last month in the list.
                        const lastMonthId = querySnapshot.docs[querySnapshot.docs.length - 1].id;
                        console.log("No month selected. Defaulting to last month:", lastMonthId);
                        displayMonthPlan(lastMonthId); // Automatically load the last month
                    }
                    // --- MODIFIED BLOCK END ---
                }
				
				// --- START: FIX ---
                // This line was moved from inside the 'else' block
                // Now it will run even if the querySnapshot is empty
                monthNavButtonsContainer.insertAdjacentHTML('beforeend', addMonthBtnHTML);
                // --- END: FIX ---
				
                // Restore scroll position
                if (shouldRestoreScroll) {
                    console.log("Restoring scroll position to (loadStudyPlans):", scrollY);
                    window.scrollTo({ top: scrollY, behavior: 'auto' }); // Use 'auto' for instant jump
                }
            }, (error) => {
                console.error("Error fetching study plans:", error);
                currentMonthPlanDisplay.innerHTML = '<p class="text-red-500 text-center">Error loading plans.</p>';
                noPlansMessage.style.display = 'none';
                selectMonthMessage.classList.add('hidden');
            });
        }
		

		/**
 * NEW: Performs targeted UI updates for the entire month
 * without a full re-render.
 */
function updateMonthUI(monthId, monthData, weeksData) {
    if (!monthData) return;
    
    const monthElement = document.querySelector(`.card[data-month-id="${monthId}"]`);
    if (!monthElement) return; // Month isn't on the page

    // 1. Update Monthly Progress Trackers
    // --- START: MODIFIED ---
    const monthlyPercent = calculateOverallMonthlyProgress(weeksData);
    const { 
        weekly: lastWeekPercent, 
        daily: lastDayPercent, 
        link: continueLink 
    } = findLastProgressTrackers(monthId, monthData, weeksData);
    // --- END: MODIFIED ---

    updateTracker(monthElement, `#monthly-tracker-${monthId}`, monthlyPercent);
    updateTracker(monthElement, `#weekly-tracker-${monthId}`, lastWeekPercent);
    updateTracker(monthElement, `#daily-tracker-${monthId}`, lastDayPercent, continueLink);

    // 2. Update Weekly Targets & Progress
    for (const weekId of ['week1', 'week2', 'week3', 'week4']) {
        // --- START: MODIFIED ---
        const weekData = weeksData[weekId]; // Get week data from the new object
        // --- END: MODIFIED ---
        
        // Update weekly target text
        const targetTextElement = monthElement.querySelector(`#target-text-${monthId}-${weekId}`);
        if (targetTextElement) {
            targetTextElement.textContent = monthData.weeklyTargets?.[weekId] || '';
        }

        if (weekData) {
            // Update weekly progress bar
            const weekPerc = calculateWeeklyProgress(weekData);
            const weekBar = monthElement.querySelector(`#week-bar-${monthId}-${weekId}`);
            const weekPercText = monthElement.querySelector(`#week-perc-${monthId}-${weekId}`);
            if (weekBar && weekPercText) {
                weekBar.style.width = `${weekPerc}%`;
                weekBar.style.opacity = weekPerc > 0 ? '1' : '0';
                weekPercText.textContent = `${weekPerc}%`;
            }

            // 3. Update Daily Progress
            weekData.days?.forEach((dayData, dayIndex) => {
                const dayPerc = calculateDailyProgress(dayData);
                const dayBar = monthElement.querySelector(`#day-bar-${monthId}-${weekId}-${dayIndex}`);
                const dayPercText = monthElement.querySelector(`#day-perc-${monthId}-${weekId}-${dayIndex}`);
                if (dayBar && dayPercText) {
                    dayBar.style.width = `${Math.min(dayPerc, 100)}%`;
                    dayBar.style.opacity = dayPerc > 0 ? '1' : '0';
                    dayPercText.textContent = `${dayPerc}%`;
                }

                // 4. Update Row Checkboxes & Classes (if not in edit mode)
                const daySection = monthElement.querySelector(`#day-${monthId}-${weekId}-${dayIndex}`);
                if (daySection && !daySection.classList.contains('editing')) {
                    dayData.rows?.forEach((rowData, rowIndex) => {
                        const row = daySection.querySelector(`tr[data-row-index="${rowIndex}"]`);
                        if (row) {
                            const checkbox = row.querySelector('.completion-checkbox');
                            if (checkbox) checkbox.checked = rowData.completed;
                            row.classList.toggle('row-completed', rowData.completed);
                        }
                    });
                }
            });
        }
    }
}

		/**
		 * NEW: Helper function to update a single progress tracker.
		 */
		function updateTracker(container, selector, percentage, continueLink = null) {
			const tracker = container.querySelector(selector);
			if (!tracker) return;

			const score = tracker.querySelector('.tracker-score');
			const progress = tracker.querySelector('.progress');
			const cap = tracker.querySelector('.end-cap');
			const circumference = 408;
			const radius = 65;
			const center = 75;

			// Update text
			score.textContent = percentage + '%';
			
			// Update bar
			const offset = circumference - (circumference * percentage) / 100;
			progress.style.strokeDashoffset = offset;

			// Update cap
			const angle = (percentage / 100) * 360;
			const rads = (angle - 90) * (Math.PI / 180);
			cap.style.left = `${center + radius * Math.cos(rads)}px`;
			cap.style.top = `${center + radius * Math.sin(rads)}px`;
			cap.style.visibility = percentage === 0 ? 'hidden' : 'visible';

			// Update "Continue" button
			const continueBtn = tracker.querySelector('.tracker-continue-btn');
			if (continueLink) {
				if (continueBtn) continueBtn.href = continueLink;
				else tracker.querySelector('.inner-text').insertAdjacentHTML('beforeend', `<a href="${continueLink}" class="tracker-continue-btn">Continue</a>`);
			} else {
				if (continueBtn) continueBtn.remove();
			}
		}
         // Display a specific month's plan
        async function displayMonthPlan(monthId, anchorId = null) {
            if (!currentUser || !userId) return;
             console.log("Displaying plan for month:", monthId);

             // Check if this month is *already* active
             const activeBtn = monthNavButtonsContainer.querySelector('button.active-month');
             const isAlreadyActive = (activeBtn && activeBtn.dataset.monthId === monthId);

             monthNavButtonsContainer.querySelectorAll('button').forEach(btn => {
                 btn.classList.toggle('active-month', btn.dataset.monthId === monthId);
                 btn.classList.toggle('action-button-secondary', btn.dataset.monthId !== monthId);
             });

            if (isAlreadyActive && !anchorId) {
                 // Month is already displayed AND we are NOT trying to
                 // scroll to a new day, so just stop.
                return; 
             }
             // If we are here, it means:
             // 1. We are loading a new month (isAlreadyActive = false)
             // 2. We are RE-loading the current month to show a new day (isAlreadyActive = true, anchorId = true)

             currentMonthPlanDisplay.innerHTML = '<p class="text-center text-gray-500 italic py-10">Loading...</p>';
             selectMonthMessage.classList.add('hidden');

             if (unsubscribeActiveMonth) {
                 unsubscribeActiveMonth();
             }

             // --- START: NEW DATA LOADING LOGIC ---
             const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);

             try {
                 // We will listen to the MONTH document for changes
                 unsubscribeActiveMonth = onSnapshot(monthDocRef, async (monthDocSnap) => {
                     
                     // 1. Check if we should ignore this update
                     const activeBtn = monthNavButtonsContainer.querySelector('button.active-month');
                     if (!activeBtn || activeBtn.dataset.monthId !== monthId) {
                         console.log("Snapshot received for non-active month. Ignoring render.");
                         if (unsubscribeActiveMonth) unsubscribeActiveMonth();
                         return;
                     }

                     const isCurrentlyEditing = currentMonthPlanDisplay.querySelector('.day-section.editing');
                     if (isCurrentlyEditing) {
                         console.log("Skipping all re-renders because a day is in edit mode.");
                         return;
                     }

                     if (!monthDocSnap.exists()) {
                         console.error("Document for monthId not found (or deleted):", monthId);
                         currentMonthPlanDisplay.innerHTML = '<p class="text-red-500 text-center">This plan was not found.</p>';
                         return;
                     }
                     
                     // 2. Get the main month data (targets, name, etc.)
                     const monthData = monthDocSnap.data();

                     
                     
                     // 3. NOW, fetch all the week documents from the subcollection
                     const weeksCollectionRef = collection(db, monthDocRef.path, 'weeks');
                     const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                     
                     const weeksData = {}; // This will hold { week1: {days:[]}, week2: {days:[]} }
                     weeksQuerySnapshot.forEach(doc => {
                         weeksData[doc.id] = doc.data();
                     });
                     
					 activeWeeksDataCache = weeksData;
					 
                     console.log("Fetched month data and", weeksQuerySnapshot.size, "week documents.");

                     // 4. Check for structural changes (new/deleted WEEKS)
                     const monthElement = currentMonthPlanDisplay.querySelector(`.card[data-month-id="${monthId}"]`);
                     let structureHasChanged = false;
                     
                    if (monthElement) {
                         // Fix: Don't compare total week counts. Instead, check day counts for all 4 fixed weeks.
                         for (const weekId of ['week1', 'week2', 'week3', 'week4']) {
                             const domDayCount = monthElement.querySelectorAll(`.week-section[data-week-id="${weekId}"] .day-section`).length;
                             const dataDayCount = weeksData[weekId]?.days?.length || 0;
                             
                             if (domDayCount !== dataDayCount) {
                                 structureHasChanged = true;
                                 break;
                             }
                         }
                     }
                     
                     // 5. Decide whether to re-render or do a targeted update
                     if (structureHasChanged || !monthElement) {
                         // --- CASE 1: FULL RE-RENDER ---
                         console.log("Structural change or first load. Performing full re-render.");
                         
                         let scrollY = window.scrollY;
                         let parentContainerRect = currentMonthPlanDisplay.getBoundingClientRect();
                         let shouldRestoreScroll = parentContainerRect.top < 0;

                         currentMonthPlanDisplay.innerHTML = '';
                         // Pass BOTH data objects to the renderer
                         currentMonthPlanDisplay.appendChild(createMonthElement(monthId, monthData, weeksData));

                         if (shouldRestoreScroll) {
                             window.scrollTo({ top: scrollY, behavior: 'auto' });
                         } else if (anchorId) {
                             const targetElement = document.getElementById(anchorId);
                             if (targetElement) {
                                 targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             }
                             anchorId = null;
                         }

                     } else {
                         // --- CASE 2: TARGETED UPDATE ---
                         console.log("Data change detected. Performing targeted UI update.");
                         // Pass BOTH data objects to the updater
                         updateMonthUI(monthId, monthData, weeksData);
                     }
                 });
             } catch (error) {
                 console.error("Error fetching specific month plan:", error);
                 currentMonthPlanDisplay.innerHTML = '<p class="text-red-500 text-center">Error loading this month\'s plan.</p>';
             }
             // --- END: NEW DATA LOADING LOGIC ---
         }


       // 1. This listener OPENS the modal and sets the default date
        document.addEventListener('click', (e) => {
            // Check if the clicked element or its parent is the inline add button
            if (!e.target.matches('#add-month-btn-inline') && !e.target.closest('#add-month-btn-inline')) {
                return; // Not our button, do nothing
            }
            
             e.preventDefault(); // Prevent page jump
             if (!currentUser || !userId) return;

             // --- START: New Logic ---
             
             // 1. Find the last month in the list
             const monthButtons = monthNavButtonsContainer.querySelectorAll('button[data-month-id]');
             let nextYear, nextMonthIndex;

             if (monthButtons.length > 0) {
                 const lastMonthButton = monthButtons[monthButtons.length - 1];
                 const lastMonthId = lastMonthButton.dataset.monthId; // e.g., "2025-11"
                 const parts = lastMonthId.split('-');
                 const lastYear = parseInt(parts[0]);
                 const lastMonth = parseInt(parts[1]) - 1; // 0-indexed (e.g., 10 for November)

                 // 2. Calculate the next month
                 const nextMonthDate = new Date(lastYear, lastMonth);
                 nextMonthDate.setMonth(nextMonthDate.getMonth() + 1); // This handles year rollover
                 
                 nextYear = nextMonthDate.getFullYear();
                 nextMonthIndex = nextMonthDate.getMonth(); // 0-indexed
             } else {
                 // No months exist. Default to the *current* month.
                 const today = new Date();
                 nextYear = today.getFullYear();
                 nextMonthIndex = today.getMonth();
             }

             // 3. Populate the modal
             newMonthSelect.value = nextMonthIndex;
             newMonthYear.value = nextYear;

             // 4. Show the modal
             addMonthModal.style.display = 'block';
             newMonthYear.focus(); // Focus the year input
             // --- END: New Logic ---
        });

        // 2. This listener SAVES the new month from the modal (NOW OPTIMISTIC)
        saveNewMonthBtn.addEventListener('click', async () => {
            if (!currentUser || !userId) return;

            // 1. Get values from modal
            const monthIndex = parseInt(newMonthSelect.value); // 0-11
            const year = parseInt(newMonthYear.value);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            // 2. Validate
            if (isNaN(year) || year < 2020 || year > 2100) {
                showCustomAlert("Please enter a valid year (e.g., 2025).", "error");
                return;
            }

            // 3. Create names and ID
            const monthName = `${monthNames[monthIndex]} ${year}`;
            const monthId = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`; // e.g., "2025-12"

            const docRef = doc(db, getUserPlansCollectionPath(), monthId);
            
            // 4. We MUST check for duplicates before proceeding
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                 showCustomAlert(`Month ID ${monthId} (${monthName}) already exists.`, "error");
                 return; 
            }

            // 5. Create the new data object
            const newPlanData = {
               monthName: monthName,
               createdAt: Timestamp.now(),
               weeklyTargets: { week1: '', week2: '', week3: '', week4: '' }
            };

            // --- START: NEW OPTIMISTIC FLOW ---
            
            // 6. Perform instant UI actions
            showCustomAlert("Month Created Successfully!", "success");
            closeModal('add-month-modal');
            
            // 7. Instantly load the new (empty) month.
            // This will show "Loading..." and set up the listener.
            displayMonthPlan(monthId); 

            // 8. Run the database write in the background (no 'await')
            setDoc(docRef, newPlanData)
                .then(() => {
                    console.log("Background save of new month successful:", monthId);
                    // The onSnapshot listener in displayMonthPlan will automatically
                    // detect this change and render the new month.
                })
                .catch((error) => {
                    // The save FAILED. The user already saw "success", so we must now show a hard error.
                    console.error("Error adding new month in background:", error); 
                    showCustomAlert("CRITICAL ERROR: Could not save new month. Please refresh.", "error");
                    setSyncStatus("Error", "red");
                    // Overwrite the loading screen with an error
                    currentMonthPlanDisplay.innerHTML = '<p class="text-red-500 text-center">Error creating month. Please refresh.</p>';
                });
            // --- END: NEW OPTIMISTIC FLOW ---
        });
		
		showAllVocabBtn.addEventListener('click', displayAllVocabs);
			// --- START: ADD THIS NEW FUNCTION ---
        async function displayAllVocabs() {
            if (!currentUser || !userId) {
                showCustomAlert("Please log in to see your vocabulary list.");
                return;
            }

            const modal = document.getElementById('all-vocab-modal');
            const contentDiv = document.getElementById('vocab-list-content');
            const totalVocabCountSpan = document.getElementById('total-vocab-count');
            
            modal.style.display = "block";
            contentDiv.innerHTML = '<p class="text-center text-gray-500 italic py-10">Loading all vocabularies...</p>';
            if (totalVocabCountSpan) totalVocabCountSpan.textContent = "...";
            setSyncStatus("Loading...", "blue");

            try {
                const plansCollectionPath = getUserPlansCollectionPath();
                const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
                const querySnapshot = await getDocs(q);

                let allVocabsHtml = '';
                let totalVocabCount = 0;

                if (querySnapshot.empty) {
                    contentDiv.innerHTML = '<p class="text-center text-gray-500 italic py-10">No study plans found.</p>';
                    if (totalVocabCountSpan) totalVocabCountSpan.textContent = "0";
                    setSyncStatus("Synced", "green");
                    return;
                }

                for (const docSnap of querySnapshot.docs) {
                    const monthId = docSnap.id;
                    const monthData = docSnap.data();
                    const monthName = monthData.monthName || monthId;
                    
                    // --- START: MODIFIED ---
                    // Fetch the weeks subcollection for this month
                    const weeksCollectionRef = collection(db, docSnap.ref.path, 'weeks');
                    const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                    // --- END: MODIFIED ---

                    for (const weekDocSnap of weeksQuerySnapshot.docs) {
                        const weekId = weekDocSnap.id;
                        const weekData = weekDocSnap.data();
                        if (!weekData || !weekData.days) continue;

                        let weekVocabs = [];
                        for (const day of weekData.days) {
                            for (const row of day.rows) {
                                if (row.subject?.toLowerCase() === 'vocabulary' && row.vocabData) {
                                    weekVocabs.push(...row.vocabData);
                                }
                            }
                        }

                        if (weekVocabs.length > 0) {
                            totalVocabCount += weekVocabs.length;
                            const weekTitle = weekId.replace('week', 'Week ');
                            
                            allVocabsHtml += `<h4>${weekTitle} - ${monthName}</h4>`;
                            allVocabsHtml += `
                                <table>
                                    <thead>
                                        <tr>
                                            <th class="sl-column">SL.</th>
                                            <th>Word</th>
                                            <th>Meaning</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${weekVocabs.map((v, index) => `
                                            <tr>
                                                <td class="sl-column">${index + 1}</td>
                                                <td>${escapeHtml(v.word || '')}</td>
                                                <td>${escapeHtml(v.meaning || '')}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `;
                        }
                    }
                }

                if (totalVocabCount === 0) {
                    contentDiv.innerHTML = '<p class="text-center text-gray-500 italic py-10">You have not added any vocabularies to your study plans yet.</p>';
                } else {
                    contentDiv.innerHTML = allVocabsHtml;
                }
                
                if (totalVocabCountSpan) totalVocabCountSpan.textContent = totalVocabCount;
                setSyncStatus("Synced", "green");

            } catch (error) {
                console.error("Error fetching all vocabularies:", error);
                contentDiv.innerHTML = '<p class="text-center text-red-500 py-10">Could not load vocabularies. Please try again.</p>';
                if (totalVocabCountSpan) totalVocabCountSpan.textContent = "Error";
                setSyncStatus("Error", "red");
            }
        }
        // --- END: ADD THIS FUNCTION ---
		

		
		
		
        // --- UI Creation ---
        function createMonthElement(monthId, monthData, weeksData) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'mb-12 p-6 card';
            monthDiv.dataset.monthId = monthId;

            const targetColors = { week1: 'text-indigo-700', week2: 'text-teal-700', week3: 'text-amber-700', week4: 'text-rose-700' };
            const targetHoverBgColors = { week1: 'hover:bg-indigo-50', week2: 'hover:bg-teal-50', week3: 'hover:bg-amber-50', week4: 'hover:bg-rose-50' };

            const monthlyPercent = calculateOverallMonthlyProgress(weeksData);
            const { 
                weekly: lastWeekPercent, 
                daily: lastDayPercent, 
                link: continueLink 
            } = findLastProgressTrackers(monthId, monthData, weeksData);

            monthDiv.innerHTML = `
                 <div class="flex justify-between items-start mb-6">
                     <h2 class="text-2xl font-bold text-emerald-600">${monthData.monthName || 'Unnamed Month'} <span class="text-lg text-gray-400 font-normal">(${monthId})</span></h2>
                     
                     <div class="flex items-center gap-2">
                        <button class="action-button action-button-secondary text-xs view-month-summary-btn" style="height: 32px;">
                            <i class="fas fa-table mr-1"></i> Month Summary
                        </button>
                        ${isGuestMode ? '' : '<button class="icon-button delete-month-btn" title="Delete Month"><i class="fas fa-trash-alt text-red-500"></i></button>'}
                     </div>
                     </div>

                 <div class="progress-trackers-container mb-10" data-month-id="${monthId}">
                    ${createTrackerHTML(
                        `daily-tracker-${monthId}`, 
                        'Last Day',
                        lastDayPercent,
                        '#ff007f', 
                        '#a85eff',
                        continueLink
                    )}
                    ${createTrackerHTML(
                        `weekly-tracker-${monthId}`, 
                        'Last Week',
                        lastWeekPercent,
                        '#00ffb9', 
                        '#6a5eff'
                    )}
                    ${createTrackerHTML(
                        `monthly-tracker-${monthId}`, 
                        'Monthly Progress',
                        monthlyPercent,
                        '#2e8bff', 
                        '#00c3ff'
                    )}
                 </div>

                 <div class="mb-8">
                    <div class="flex justify-between items-center mb-4">
                         <h3 class="text-2xl font-semibold text-gray-700">Monthly Targets</h3>
                         ${isGuestMode ? '' : '<button class="action-button action-button-secondary text-xs edit-targets-btn" data-editing="false"><i class="fas fa-pencil-alt mr-1"></i> Edit Targets</button>'}
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 monthly-targets">
						${[1, 2, 3, 4].map(weekNum => `
							<a href="#week-${monthId}-week${weekNum}" class="target-card-link ${targetHoverBgColors[`week${weekNum}`] || ''}">
								<div class="target-card">
									<h3 class="font-semibold text-lg ${targetColors[`week${weekNum}`] || 'text-gray-700'} mb-2">Week ${weekNum}</h3>
									<textarea id="target-week-${monthId}-${weekNum}" data-week="week${weekNum}" class="target-textarea w-full" placeholder="Enter target..." disabled>${escapeHtml(monthData.weeklyTargets?.[`week${weekNum}`] || '')}</textarea>
								</div>
							</a>
						`).join('')}
					</div>
                </div>
                 <div class="space-y-8 weekly-plans-container">
                    ${[1, 2, 3, 4].map(weekNum => {
                        const weekId = `week${weekNum}`;
                        const targetText = monthData.weeklyTargets?.[weekId] || '';
                        return createWeekElement(monthId, weekId, weeksData[weekId], `week-${monthId}-${weekId}`, targetText);
                    }).join('')}
                </div>`;

             // --- START: ADD LISTENER FOR NEW BUTTON ---
             monthDiv.querySelector('.view-month-summary-btn').addEventListener('click', () => {
                 openMonthSummaryModal(monthId);
             });
             // --- END: ADD LISTENER FOR NEW BUTTON ---

             if (!isGuestMode) {
                 monthDiv.querySelector('.edit-targets-btn').addEventListener('click', (e) => handleEditTargets(e.currentTarget, monthId));
                 monthDiv.querySelector('.delete-month-btn').addEventListener('click', () => confirmDeleteMonth(monthId, monthData.monthName || monthId));
             }
             
             attachWeekEventListeners(monthDiv, monthId);
             
             const targetGroup = monthDiv.querySelector('.monthly-targets');
             setTimeout(() => {
                syncTextareaHeights(targetGroup);
             }, 0); 

             animateTrackers(monthDiv);
             
             return monthDiv;
        }

        function createWeekElement(monthId, weekId, weekData, sectionId, targetText) {
            // weekData is now the doc { days: [...] } or undefined if it doesn't exist
            const daysHtml = weekData?.days?.length > 0
                ? weekData.days.map((dayData, index) => createDayElement(monthId, weekId, index, dayData)).join('')
                : '<p class="text-gray-500 italic text-sm py-4 text-center">No days added yet.</p>';
            const totalDays = weekData?.days?.length || 0;
            
            const initialProgress = calculateWeeklyProgress(weekData);
            const headerHeight = (pageHeader.classList.contains('header-hidden') ? 0 : (pageHeader.offsetHeight || 65)) + 'px';
            
            const targetHtml = `<p class="week-target-text" id="target-text-${monthId}-${weekId}">${escapeHtml(targetText)}</p>`;

            return `
                <div id="${sectionId}" class="bg-white/60 border border-gray-200 p-4 rounded-lg shadow week-section" data-week-id="${weekId}">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-emerald-700 capitalize">${weekId.replace('week', 'Week ')} Plan</h3>
                        <button class="action-button action-button-secondary text-xs view-week-summary-btn" data-week-id="${weekId}">
                            <i class="fas fa-table mr-1"></i> View Summary
                        </button>
                    </div>
                    ${targetHtml}
                    
                    <div class="sticky-progress-wrapper" style="top: ${headerHeight};">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Weekly Progress</span>
                            <span id="week-perc-${monthId}-${weekId}" class="progress-percentage font-medium">${initialProgress}%</span>
                        </div>
                        
                        <div class="progress-bar-container w-full"> 
                            <div id="week-bar-${monthId}-${weekId}" class="progress-bar-fill progress-bar-weekly" style="width: ${initialProgress}%;"></div> 
                        </div>
                    </div>
                    <div class="days-container space-y-6 mt-4"> ${daysHtml} </div>
                     ${isGuestMode ? '' : (totalDays < 7 ? (totalDays > 0 ? `<button class="add-day-btn w-full mt-4" data-week-id="${weekId}"><i class="fas fa-plus"></i> Add New Day</button>` : `<button class="action-button mt-4 add-first-day-btn" data-week-id="${weekId}"><i class="fas fa-calendar-plus mr-2"></i> Add First Day</button>`) : '<p class="text-center text-xs text-gray-400 mt-4">Maximum 7 days reached for this week.</p>')}
                </div>`;
        }

        function createDayElement(monthId, weekId, dayIndex, dayData) {
             const tableId = `table-${monthId}-${weekId}-${dayIndex}`;
             const initialDayProgress = calculateDailyProgress(dayData);
             
             // --- All MCQ Button Logic ---
             let allMcqButtonsNormalMode = '';
             const allDayMcqs = dayData.rows?.reduce((acc, row) => {
                if (row.mcqData) {
                    acc.push(...row.mcqData);
                }
                return acc;
             }, []) || [];

             if (allDayMcqs.length > 0) {
                 allMcqButtonsNormalMode = `
                     <button class="action-button action-button-secondary text-xs view-all-mcq-btn"><i class="fas fa-eye mr-1"></i> View All MCQ</button>
                     <button class="action-button action-button-secondary text-xs test-all-mcq-btn" style="border-color: #6366f1; color: #4f46e5;"><i class="fas fa-tasks mr-1"></i> Test All MCQ</button>
                 `;
             }

             // --- START: NEW HTML STRUCTURE ---
             return `
                 <div class="day-section is-collapsed" id="day-${monthId}-${weekId}-${dayIndex}" data-day-index="${dayIndex}"> 
                     
                     <div class="day-section-header">
                         
                         <div class="day-header-title">
                             <h4 class="font-semibold text-gray-700">Day ${dayData.dayNumber}</h4>
                             ${isGuestMode ? '' : '<button class="icon-button delete-day-btn hidden" title="Delete Day"><i class="fas fa-calendar-times text-red-500"></i></button>'}
                             </div>
                         
                         <div class="day-header-progress day-progress-wrapper" data-day-index="${dayIndex}">
                             <div class="flex justify-between text-xs text-gray-500">
                                 <span>Day Progress</span>
                                 <span id="day-perc-${monthId}-${weekId}-${dayIndex}" class="progress-percentage font-medium">${initialDayProgress}%</span>
                             </div>
                             <div class="progress-bar-container w-full"> 
                                 <div id="day-bar-${monthId}-${weekId}-${dayIndex}" class="progress-bar-fill progress-bar-daily" style="width: ${Math.min(initialDayProgress, 100)}%;"></div> 
                             </div>
                         </div>
                         
                         <button class="day-toggle-btn" title="Expand/Collapse">
                             <i class="fas fa-chevron-down fa-lg"></i>
                         </button>

                     </div>
                     
                     <div class="day-section-body">
                         
                         <div class="flex justify-end items-center gap-2 flex-wrap mb-4 mt-3">
                             ${allMcqButtonsNormalMode}
                             ${isGuestMode ? '' : '<button class="action-button action-button-secondary text-xs edit-day-btn"><i class="fas fa-pencil-alt mr-1"></i> Edit</button>'}
                             </div>
                         
                         <table class="w-full text-sm text-left text-gray-600 study-table" id="${tableId}">
                             <thead class="text-xs text-gray-500 uppercase">
                                 <tr>
                                     <th scope="col" class="px-3 py-2 md:w-[10%] text-center">Subject</th>
                                     <th scope="col" class="px-3 py-2 md:w-[38%] text-center">Topic / Vocab</th>
                                     <th scope="col" class="px-3 py-2 questions-col text-center">Questions</th>
                                     <th scope="col" class="px-3 py-2 test-col text-center">Test</th>
                                     <th scope="col" class="px-3 py-2 md:w-[10%] text-center">Comment</th>
                                     <th scope="col" class="px-3 py-2 w-[5%] md:w-[5%] center-cell text-center">Done</th>
                                     <th scope="col" class="px-3 py-2 w-[10%] md:w-[5%] center-cell completion-perc-header hidden text-center">out of 100%</th>
                                     <th scope="col" class="px-3 py-2 w-[5%] md:w-[5%] center-cell actions-header hidden text-center"></th> 
                                 </tr>
                             </thead>
                             <tbody> ${dayData.rows?.map((rowData, rowIndex) => createTableRow(monthId, weekId, dayIndex, rowIndex, rowData, false)).join('') || ''} </tbody>
                         </table>
                         
                         <div class="edit-mode-controls hidden mt-3 flex flex-wrap gap-2 justify-between items-center">
                             <div class="flex flex-wrap gap-2"> 
                                 <button class="action-button action-button-secondary text-xs add-normal-row-btn"><i class="fas fa-plus mr-1"></i> Add Row</button>
                                 <button class="action-button action-button-secondary text-xs add-vocab-row-btn"><i class="fas fa-book mr-1"></i> Add Vocabulary</button>
                             </div>
                             <button class="action-button text-xs save-day-btn"><i class="fas fa-save mr-1"></i> Save</button>
                         </div>
                         
                     </div>
                     </div>`;
             // --- END: NEW HTML STRUCTURE ---
        }

        function createTableRow(monthId, weekId, dayIndex, rowIndex, rowData, isEditing) {
             const uniqueRowId = `row-${monthId}-${weekId}-${dayIndex}-${rowIndex}`;
             const isVocabRow = rowData.subject?.toLowerCase() === 'vocabulary';

             let topicContent = '';
             if (isEditing) {
                 if (isVocabRow) {
                     topicContent = `<div class="vocab-edit-container space-y-2">`;
                     (rowData.vocabData || [{ word: '', meaning: '' }]).forEach((pair, pairIndex) => {
                         topicContent += `
                             <div class="vocab-pair" data-pair-index="${pairIndex}">
                                 <input type="text" class="vocab-input vocab-word-input" placeholder="Word" value="${escapeHtml(pair.word || '')}">
                                 <input type="text" class="vocab-input vocab-meaning-input" placeholder="Meaning" value="${escapeHtml(pair.meaning || '')}">
                                 <button type="button" class="icon-button delete-vocab-pair-btn" title="Delete Pair"><i class="fas fa-times text-red-500"></i></button>
                             </div>`;
                     });
                     // --- MODIFIED BLOCK TO ADD BUTTON ---
                     topicContent += `<div class="flex items-center gap-2 mt-2 vocab-button-container">
                                        <button type="button" class="icon-button add-vocab-pair-btn" title="Add Word/Meaning Pair"><i class="fas fa-plus-circle text-emerald-500"></i></button>
                                        <button type="button" class="action-button action-button-secondary add-vocab-code-btn" style="padding: 4px 8px; font-size: 0.75rem;"><i class="fas fa-code mr-1"></i> Add with Code</button>
                                        <button type="button" class="action-button action-button-secondary add-story-btn" style="padding: 4px 8px; font-size: 0.75rem;"><i class="fas fa-feather-alt mr-1"></i> Story</button>
                                        </div>
                                </div>`; // Closed container
                     // --- END MODIFIED BLOCK ---
                 } else {
                     topicContent = `<textarea class="editable-input topic-input text-xs" rows="2" placeholder="Topic details...">${escapeHtml(rowData.topic || '')}</textarea>`;
                 }
             } else {
                 if (isVocabRow) {
                     topicContent = generateVocabHtml(rowData.vocabData);
                 } else {
                     topicContent = `<span class="topic-display">${escapeHtml(rowData.topic || '-')}</span>`;
                 }
             }

             // --- NEW BUTTONS LOGIC ---
             // --- NEW BUTTONS LOGIC ---
             let buttonsHtml = '';
             if (!isEditing && isVocabRow) {
                 if (rowData.story) {
                    buttonsHtml += `<button class="action-button action-button-secondary text-xs read-story-btn"><i class="fas fa-book-open mr-1"></i> Read Story</button>`;
                 }
                 // Vocab Quiz button logic removed from here
             }
			
			
			
             const completedClass = (!isEditing && rowData.completed) ? 'row-completed' : '';

             // --- START: Req 1 - Button logic for new columns ---
             let questionsCellHtml = '';
             let testCellHtml = '';

             if (isEditing) {
                // Edit Mode: Check if questions already exist
                const hasMcqs = rowData.mcqData && rowData.mcqData.length > 0;
                const btnText = hasMcqs ? 'Edit Qs' : 'Add Qs';
                const btnIcon = hasMcqs ? 'fa-pencil-alt' : 'fa-plus';
                
                questionsCellHtml = `<button class="action-button add-row-mcq-btn" data-row-index="${rowIndex}"><i class="fas ${btnIcon} mr-1"></i> ${btnText}</button>`;
             } else {
                // Normal Mode: Show "View Qs" and "Quiz" buttons if data exists
                if (rowData.mcqData && rowData.mcqData.length > 0) {
                    questionsCellHtml = `<button class="action-button view-row-mcq-btn" data-row-index="${rowIndex}"><i class="fas fa-eye mr-1"></i> View Qs</button>`;
                    
                    if (rowData.mcqData.length >= 1) { // 1 বা তার বেশি প্রশ্ন থাকলেই কুইজ বাটন দেখাবে
                        // --- START: MODIFIED ---
                        // Added classes and style to match the vocab quiz button
                        testCellHtml = `<button class="action-button action-button-secondary text-xs test-row-mcq-btn" data-row-index="${rowIndex}" style="border-color: #6366f1; color: #4f46e5;">
                                            <i class="fas fa-question-circle mr-1"></i> Quiz
                                        </button>`;
                        // --- END: MODIFIED ---
                    }
                }

                // --- START: ADDED THIS BLOCK ---
                // If it's a Vocab row, show the Vocab Quiz button in this column
                if (isVocabRow && rowData.vocabData && rowData.vocabData.length >= 4) {
                    testCellHtml = `<button class="action-button action-button-secondary text-xs quiz-btn" style="border-color: #6366f1; color: #4f46e5;"><i class="fas fa-question-circle mr-1"></i> Quiz</button>`;
                }
                // --- END: ADDED THIS BLOCK ---
             }
             // --- END: Req 1 ---

             return `
                 <tr id="${uniqueRowId}" data-row-index="${rowIndex}" class="${isEditing ? 'editing-mode' : ''} ${isVocabRow ? 'vocab-row' : 'normal-row'} ${completedClass}">
                     <td class="px-3 py-2 align-top" data-label="Subject"> ${isEditing ? `<input type="text" class="editable-input subject-input" placeholder="Subject" value="${escapeHtml(rowData.subject || '')}" ${isVocabRow ? 'readonly style="background-color:#e5e7eb;"' : ''}>` : `<span class="subject-display font-medium text-gray-700">${escapeHtml(rowData.subject || '-')}</span>`}
                     </td>
                     <td class="px-3 py-2 align-top vocab-topic-cell" data-label="Topic / Vocab"> 
                        ${topicContent}
                        ${buttonsHtml ? `<div class="flex gap-2 mt-2 flex-wrap">${buttonsHtml}</div>` : ''}
                     </td>
                     <td class="px-3 py-2 align-middle questions-col" data-label="Questions">
                        ${questionsCellHtml}
                     </td>
                     <td class="px-3 py-2 align-middle test-col" data-label="Test">
                        ${testCellHtml}
                     </td>
                     <td class="px-3 py-2 align-top" data-label="Comment"> ${isEditing ? `<textarea class="editable-input comment-input text-xs" rows="2" placeholder="Comment...">${escapeHtml(rowData.comment || '')}</textarea>` : `<span class="comment-display text-xs text-gray-500">${escapeHtml(rowData.comment || '-')}</span>`}
                     </td>
                     <td class="px-3 py-2 align-middle center-cell" data-label="Done"> <input type="checkbox" class="form-checkbox h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 completion-checkbox" ${rowData.completed ? 'checked' : ''} ${isEditing || isGuestMode ? 'disabled' : ''}>
                     </td>
                      <td class="px-3 py-2 align-middle center-cell completion-perc-cell ${isEditing ? '' : 'hidden'}" data-label="%"> ${isEditing ? `<input type="text" inputmode="decimal" class="editable-input completion-perc-input w-16 text-center text-xs" placeholder="%" value="${rowData.completionPercentage ?? ''}">` : ''}
                      </td>
                     <td class="px-3 py-2 align-middle center-cell actions-cell ${isEditing ? '' : 'hidden'}" data-label="Actions"> ${isEditing ? `<button class="icon-button delete-row-btn" title="Delete Row"><i class="fas fa-trash-alt text-red-500"></i></button>` : ''}
                     </td>
                 </tr>
             `;
        }


        // Generate Vocab HTML with new Tooltip style
        function generateVocabHtml(vocabData) {
            if (!vocabData || vocabData.length === 0) return '-';

            // এই Regex গ্লোবাল স্কোপে ডিফাইন করা আছে (লাইন ১০১)
            // const banglaRegex = /[\u0980-\u09FF]/; 

            const wordsHtml = vocabData.map(v => {
                const meaningStr = v.meaning || 'No meaning';
                let meaningHtml = '';

                const hyphenIndex = meaningStr.indexOf('-');
                
                // চেক করুন হাইফেন আছে কি না
                if (hyphenIndex > 0 && hyphenIndex < meaningStr.length - 1) {
                    let part1 = meaningStr.substring(0, hyphenIndex).trim();
                    let part2 = meaningStr.substring(hyphenIndex + 1).trim();

                    // কোন অংশটি বাংলা তা চেক করুন
                    const part1IsBangla = banglaRegex.test(part1);
                    const part2IsBangla = banglaRegex.test(part2);

                    if (part1IsBangla && !part2IsBangla) {
                        // ফরম্যাট: বাংলা - English
                        meaningHtml = `<span class="bangla-meaning-text">${escapeHtml(part1)}</span> - <span class="english-meaning-text">${escapeHtml(part2)}</span>`;
                    } else if (!part1IsBangla && part2IsBangla) {
                        // ফরম্যাট: English - বাংলা
                        meaningHtml = `<span class="english-meaning-text">${escapeHtml(part1)}</span> - <span class="bangla-meaning-text">${escapeHtml(part2)}</span>`;
                    } else {
                        // যদি উভয়ই বাংলা হয় বা কোনোটিই না হয়
                        if (part1IsBangla) part1 = `<span class="bangla-meaning-text">${escapeHtml(part1)}</span>`;
                        if (part2IsBangla) part2 = `<span class="bangla-meaning-text">${escapeHtml(part2)}</span>`;
                        meaningHtml = `${part1} - ${part2}`;
                    }
                } else {
                    // কোনো হাইফেন নেই, পুরো স্ট্রিং চেক করুন
                    if (banglaRegex.test(meaningStr)) {
                        meaningHtml = `<span class="bangla-meaning-text">${escapeHtml(meaningStr)}</span>`;
                    } else {
                        meaningHtml = escapeHtml(meaningStr);
                    }
                }

                return `<div class="vocab-word" tabindex="0">
                    ${escapeHtml(v.word || '')}
                    <span class="vocab-meaning">${meaningHtml}</span>
                 </div>`;
            }).join(''); // Join with no space, margin will handle it
            
            // Return the words inside our new flex container
            return `<div class="vocab-container">${wordsHtml}</div>`;
        }

        function escapeHtml(unsafe) {
            if (unsafe === null || unsafe === undefined) return '';
             return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }


        // --- Event Listeners ---
		// --- START: WEEK SUMMARY FEATURE ---
        // Define these variables here so they are available to the function
        const weekSummaryModal = document.getElementById('week-summary-modal');
        const weekSummaryContent = document.getElementById('week-summary-content');

        async function openWeekSummaryModal(monthId, weekId) {
            weekSummaryModal.style.display = "block";
            
            const printBtn = document.getElementById('print-week-summary-btn');
            if (printBtn) {
                printBtn.dataset.monthId = monthId; 
                printBtn.dataset.weekId = weekId;   
            }

            weekSummaryContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">Loading summary...</p>';
            
            try {
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);

                if (!weekDocSnap.exists() || !weekDocSnap.data().days || weekDocSnap.data().days.length === 0) {
                    weekSummaryContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">No data found for this week.</p>';
                    return;
                }

                const daysData = weekDocSnap.data().days;
                
                const subjectsSet = new Set();
                daysData.forEach(day => {
                    day.rows?.forEach(row => {
                        // We still collect ALL subjects to generate headers, 
                        // even if some rows aren't checked yet.
                        if (row.subject && row.subject.toLowerCase() !== 'vocabulary') {
                            subjectsSet.add(row.subject);
                        }
                    });
                });
                
                const subjects = Array.from(subjectsSet).sort();

                let tableHtml = `
                    <div class="results-table-container">
                    <table class="w-full text-sm text-left text-gray-600 study-table">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 border text-center bg-gray-100">Day</th>
                                ${subjects.map(sub => `<th class="px-4 py-3 border text-center bg-gray-100">${escapeHtml(sub)}</th>`).join('')}
                                <th class="px-4 py-3 border text-center bg-gray-100">Vocab</th> </tr>
                        </thead>
                        <tbody>
                `;

                daysData.forEach(day => {
                    tableHtml += `<tr class="hover:bg-gray-50 summary-row">`;
                    tableHtml += `<td class="px-4 py-3 border font-medium text-gray-900 whitespace-nowrap text-center">Day ${day.dayNumber}</td>`;
                    
                    subjects.forEach(subject => {
                        // --- MODIFIED FILTER LOGIC ---
                        // Only show topics if the row is CHECKED (completed)
                        const topics = day.rows
                            ?.filter(r => r.subject === subject && r.topic && r.completed) 
                            .map(r => r.topic) || [];
                            
                        const cellContent = createSummaryCellHtml(topics);
                        tableHtml += `<td class="px-4 py-3 border align-top summary-cell">${cellContent}</td>`;
                    });

                    let vocabCount = 0;
                    day.rows?.forEach(row => {
                        // EXCEPTION: Vocab count includes ALL rows (checked or unchecked)
                        if (row.subject && row.subject.toLowerCase() === 'vocabulary' && row.vocabData) {
                            vocabCount += row.vocabData.length;
                        }
                    });
                    tableHtml += `<td class="px-4 py-3 border align-middle text-center font-bold text-gray-700">${vocabCount}</td>`;

                    tableHtml += `</tr>`;
                });

                tableHtml += `</tbody></table></div>`;
                weekSummaryContent.innerHTML = tableHtml;
                updateSummaryButtons();

            } catch (error) {
                console.error("Error generating week summary:", error);
                weekSummaryContent.innerHTML = '<p class="text-center text-red-500 py-10">Could not load summary.</p>';
            }
        }
        // --- END: WEEK SUMMARY FEATURE ---
		
		// --- START: MONTH SUMMARY FEATURE ---
        const monthSummaryModal = document.getElementById('month-summary-modal');
        const monthSummaryContent = document.getElementById('month-summary-content');

        async function openMonthSummaryModal(monthId) {
            monthSummaryModal.style.display = "block";
            
            const printBtn = document.getElementById('print-month-summary-btn');
            if (printBtn) {
                printBtn.dataset.monthId = monthId; 
            }

            monthSummaryContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">Loading monthly summary...</p>';
            
            try {
                const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);
                const weeksCollectionRef = collection(db, monthDocRef.path, 'weeks');
                const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                
                if (weeksQuerySnapshot.empty) {
                    monthSummaryContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">No data found for this month.</p>';
                    return;
                }

                const weeksData = {};
                const subjectsSet = new Set();

                weeksQuerySnapshot.forEach(doc => {
                    const wId = doc.id;
                    const wData = doc.data();
                    weeksData[wId] = wData;
                    
                    wData.days?.forEach(day => {
                        day.rows?.forEach(row => {
                            if (row.subject && row.subject.toLowerCase() !== 'vocabulary') {
                                subjectsSet.add(row.subject);
                            }
                        });
                    });
                });

                const subjects = Array.from(subjectsSet).sort();

                let tableHtml = `
                    <div class="results-table-container">
                    <table class="w-full text-sm text-left text-gray-600 study-table border-collapse">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th class="px-4 py-3 border text-center bg-gray-100" style="min-width: 100px;">Week / Day</th>
                                ${subjects.map(sub => `<th class="px-4 py-3 border text-center bg-gray-100" style="min-width: 150px;">${escapeHtml(sub)}</th>`).join('')}
                                <th class="px-4 py-3 border text-center bg-gray-100" style="min-width: 80px;">Vocab</th> </tr>
                        </thead>
                        <tbody>
                `;

                ['week1', 'week2', 'week3', 'week4'].forEach(weekId => {
                    const weekData = weeksData[weekId];
                    if (!weekData || !weekData.days || weekData.days.length === 0) return;

                    tableHtml += `
                        <tr class="bg-emerald-50">
                            <td colspan="${subjects.length + 2}" class="px-4 py-2 font-bold text-emerald-700 text-center border">
                                ${weekId.replace('week', 'Week ')}
                            </td>
                        </tr>
                    `;

                    weekData.days.forEach(day => {
                        tableHtml += `<tr class="hover:bg-gray-50 summary-row">`;
                        
                        tableHtml += `<td class="px-4 py-3 border font-medium text-gray-900 whitespace-nowrap text-center">Day ${day.dayNumber}</td>`;
                        
                        subjects.forEach(subject => {
                            // --- MODIFIED FILTER LOGIC ---
                            // Only show topics if the row is CHECKED (completed)
                            const topics = day.rows
                                ?.filter(r => r.subject === subject && r.topic && r.completed)
                                .map(r => r.topic) || [];
                                
                            const cellContent = createSummaryCellHtml(topics);
                            tableHtml += `<td class="px-4 py-3 border align-top summary-cell">${cellContent}</td>`;
                        });

                        let vocabCount = 0;
                        day.rows?.forEach(row => {
                            // EXCEPTION: Vocab count includes ALL rows
                            if (row.subject && row.subject.toLowerCase() === 'vocabulary' && row.vocabData) {
                                vocabCount += row.vocabData.length;
                            }
                        });
                        tableHtml += `<td class="px-4 py-3 border align-middle text-center font-bold text-gray-700">${vocabCount}</td>`;
                });
                }); 

                tableHtml += `</tbody></table></div>`;
                monthSummaryContent.innerHTML = tableHtml;
                updateSummaryButtons();

            } catch (error) {
                console.error("Error generating month summary:", error);
                monthSummaryContent.innerHTML = '<p class="text-center text-red-500 py-10">Could not load summary.</p>';
            }
        }
        // --- END: MONTH SUMMARY FEATURE ---
       
		function attachWeekEventListeners(monthElement, monthId) {
             const weeklyPlansContainer = monthElement.querySelector('.weekly-plans-container');

             weeklyPlansContainer.addEventListener('click', async (e) => {
                 const target = e.target;
                 const button = target.closest('button');
                 const weekSection = target.closest('.week-section');
                 if (!weekSection) return;
                 const weekId = weekSection.dataset.weekId;
                 const daySection = target.closest('.day-section');
                 const row = target.closest('tr');
				
				
				// --- START: NEW COLLAPSE/EXPAND LOGIC ---
                 if (target.closest('.day-toggle-btn') || target.closest('.day-section-header')) {
                    // বাটন বা হেডারের যেকোনো জায়গায় ক্লিক করলে
                    if (button && button.classList.contains('delete-day-btn')) {
                        // --- START: FIX ---
                        // This is the delete button, handle it here
                        e.preventDefault(); // Stop it from toggling
                        confirmDeleteDay(monthId, weekId, daySection);
                        // --- END: FIX ---
                    } else {
                        e.preventDefault();
                        const dayToToggle = target.closest('.day-section');
                        if (!dayToToggle) return; // Safety check

                        const isExpanding = dayToToggle.classList.contains('is-collapsed');

                        // --- START: NEW ACCORDION LOGIC ---
                        
                        // --- START: NEW ACCORDION LOGIC (WITH SCROLL FIX) ---
                        
                        if (!isExpanding) {
                            // The user is clicking an already-open day to collapse it.
                            dayToToggle.classList.add('is-collapsed');
                        } else {
                            // The user is clicking a collapsed day to expand it.
                            
                            // 1. Find the parent month container
                            const monthElement = dayToToggle.closest('.card[data-month-id]');
                            if (!monthElement) return;

                            // 2. Collapse all other open days within this month
                            monthElement.querySelectorAll('.day-section:not(.is-collapsed)').forEach(openDay => {
                                openDay.classList.add('is-collapsed');
                            });

                            // 3. Expand the target day
                            dayToToggle.classList.remove('is-collapsed');

                            // 4. FIX: Scroll the newly opened day to the center
                            // We use a small timeout to let the DOM update (collapse the old one) first.
                            setTimeout(() => {
                                dayToToggle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 200);
                        }
                        
                        // --- END: NEW ACCORDION LOGIC ---
                    }
                    return; // টগল করার পর আর কিছু করার দরকার নেই
                 }
                 // --- END: NEW COLLAPSE/EXPAND LOGIC ---
				 
				 
                 // Handle vocab word click
                 if (target.closest('.vocab-word') && !daySection?.classList.contains('editing')) {
                     e.preventDefault();
                     showVocabMeaning(target.closest('.vocab-word'));
                     return;
                 }


                 // Handle checkbox click (OPTIMIZED: Instant Sync)
                 if (target.classList.contains('completion-checkbox')) {
                     if (!daySection?.classList.contains('editing')) {
                         // 1. Instant Visual Feedback (Toggle Class)
                         row?.classList.toggle('row-completed', target.checked);
                         
                         (async () => {
                            setSyncStatus("Syncing...", "yellow");
                            
                            const dayIndex = parseInt(daySection.dataset.dayIndex);
                            const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);

                            // 2. Prepare Data (Read from DOM/Cache - Instant)
                            // Set global flag so saveDataToFirebase knows the context
                            isCheckboxClickGlobal = { weekId: weekId, dayIndex: dayIndex }; 
                            
                            const parseResult = await parseAndPrepareSaveData(daySection, weekId, true); 
                            
                            if (parseResult === null) {
                                setSyncStatus("Error", "red");
                                target.checked = !target.checked; // Revert on error
                                return;
                            }
                            
                            const { updatedRows, updatePayload } = parseResult;
                            
                            // 3. Update Cache Instantly
                            if (activeWeeksDataCache && activeWeeksDataCache[weekId]) {
                                activeWeeksDataCache[weekId].days = updatePayload.days;
                            }

                            // 4. Update UI Progress Bars (Pass data to avoid re-fetching)
                            // updatePayload contains { days: [...] }, which fits the structure needed
                            updateWeeklyProgressUI(monthId, weekId, updatePayload); 
                            
                            const dayDataForProgress = { rows: updatedRows };
                            updateDailyProgressUI(monthId, weekId, dayIndex, dayDataForProgress);
                            
                            // 5. Save to Firebase (Background Process)
                            // We use 'true' for isAutosave to avoid blocking, but handle status manually
                            await saveDataToFirebase(monthDocRef, updatePayload, true); 
                            
                            setSyncStatus("Synced", "green");
                         })();

                     } else {
                         e.preventDefault();
                     }
                     return; 
                 }
				 
				 
                 // Handle other button clicks
                 if (!button) return;
                 e.preventDefault();

                 // Edit/Save Day Button
                 if (button.classList.contains('edit-day-btn') || button.classList.contains('save-day-btn')) {
                     const isEditing = daySection.classList.contains('editing');
                     toggleDayEditMode(monthId, weekId, daySection, !isEditing);
                 }
                 // Add Normal Row Button (Edit Mode)
                 else if (button.classList.contains('add-normal-row-btn')) { addRowToDay(monthId, weekId, daySection, 'normal'); }
                 // Add Vocab Row Button (Edit Mode)
                 else if (button.classList.contains('add-vocab-row-btn')) { addRowToDay(monthId, weekId, daySection, 'vocabulary'); }
                 // Add/Edit Story Button (Edit Mode - Req 5)
                 else if (button.classList.contains('add-story-btn')) {
                     const dayIndex = parseInt(daySection.dataset.dayIndex);
                     // Find the parent row
                     const vocabRow = button.closest('tr.vocab-row');
                     if (vocabRow) {
                        const vocabRowIndex = parseInt(vocabRow.dataset.rowIndex);
                        openEditStoryModal(monthId, weekId, dayIndex, vocabRowIndex);
                     } else {
                        showCustomAlert("Error finding vocab row for story.", "error");
                     }
                 }
				 
				 // --- START: NEW ROW-LEVEL MCQ LISTENERS (Req 1) ---
                 else if (button.classList.contains('add-row-mcq-btn')) {
                    const dayIndex = parseInt(daySection.dataset.dayIndex);
                    const rowIndex = parseInt(button.dataset.rowIndex);
                    openAddMcqModal(monthId, weekId, dayIndex, rowIndex);
                 }
                 else if (button.classList.contains('view-row-mcq-btn')) {
                    const dayIndex = parseInt(daySection.dataset.dayIndex);
                    const rowIndex = parseInt(button.dataset.rowIndex);
                    openViewMcqModal(monthId, weekId, dayIndex, rowIndex);
                 }
                 else if (button.classList.contains('test-row-mcq-btn')) {
                    const dayIndex = parseInt(daySection.dataset.dayIndex);
                    const rowIndex = parseInt(button.dataset.rowIndex);
                    startMcqQuiz(monthId, weekId, dayIndex, rowIndex);
                 }
                 // --- END: NEW ROW-LEVEL MCQ LISTENERS ---
				 
				 
				 // --- MODIFIED CLICK HANDLER WITH LOGS ---
                 else if (button.classList.contains('add-vocab-code-btn')) {
                     console.log("Checkpoint 1: 'Add with Code' button clicked.");
                     const vocabRow = target.closest('tr.vocab-row'); // Find parent row
                     if (vocabRow) {
                         console.log("Checkpoint 2: Found vocabRow:", vocabRow);
                         const vocabContainer = vocabRow.querySelector('.vocab-edit-container');
                         if (vocabContainer) {
                             console.log("Checkpoint 3: Found vocabContainer:", vocabContainer);
                             openVocabCodeModal(vocabContainer);
                         } else {
                             console.error("CRITICAL: Found row, but NOT '.vocab-edit-container' inside it.");
                         }
                     } else {
                         console.error("CRITICAL: Could not find parent 'tr.vocab-row'.");
                     }
                 }
                 // --- END MODIFIED BLOCK ---
                 // Delete Row Button (Edit Mode)
                 else if (button.classList.contains('delete-row-btn')) {
                    if (row.classList.contains('vocab-row')) {
                        confirmDeleteRow(monthId, weekId, daySection, row);
                    } else {
                        const rowIndex = parseInt(row.dataset.rowIndex);
                        deleteRow(monthId, weekId, daySection, row, rowIndex);
                    }
                 }
                 // Delete Day Button (Edit Mode)
                 else if (button.classList.contains('delete-day-btn')) { confirmDeleteDay(monthId, weekId, daySection); }
                 // Add Vocab Pair Button (Edit Mode)
                 else if (button.classList.contains('add-vocab-pair-btn')) { addVocabPairInputs(button.closest('.vocab-edit-container')); }
                 // Delete Vocab Pair Button (Edit Mode)
                 else if (button.classList.contains('delete-vocab-pair-btn')) { deleteVocabPairInputs(button.closest('.vocab-pair')); }
                 // Read Story Button (Normal Mode)
                 else if (button.classList.contains('read-story-btn')) {
                     const dayIndex = parseInt(daySection.dataset.dayIndex);
                     const rowIndex = parseInt(row.dataset.rowIndex);
                     readStory(monthId, weekId, dayIndex, rowIndex);
                 }
				 
                 else if (button.classList.contains('quiz-btn')) {
                     const dayIndex = parseInt(daySection.dataset.dayIndex);
                     const rowIndex = parseInt(row.dataset.rowIndex);
                     startQuiz(monthId, weekId, dayIndex, rowIndex);
                 }
                 // --- END: QUIZ BUTTON HANDLER ---

                 // --- START: NEW MCQ BUTTON HANDLERS ---
				 
                 else if (button.classList.contains('view-all-mcq-btn')) {
                     const dayIndex = parseInt(daySection.dataset.dayIndex);
                     openViewMcqModal(monthId, weekId, dayIndex, null); // null signifies "All MCQs"
                 }
                 else if (button.classList.contains('test-all-mcq-btn')) {
                     const dayIndex = parseInt(daySection.dataset.dayIndex);
                     startMcqQuiz(monthId, weekId, dayIndex, null); // null signifies "All MCQs"
                 }
                 // --- END: NEW MCQ BUTTON HANDLERS ---
				// --- START: NEW SUMMARY BUTTON LISTENER ---
                 else if (button.classList.contains('view-week-summary-btn')) {
                     openWeekSummaryModal(monthId, weekId);
                 }
                 // --- END: NEW SUMMARY BUTTON LISTENER ---
                 // Add Day Button / Add First Day
                 else if (button.classList.contains('add-day-btn') || button.classList.contains('add-first-day-btn')) {
                     addNewDay(monthId, weekId, weekSection);
                 }
             });

            // Add global click listener to close vocab popups
            document.addEventListener('click', function (event) {
                if (!event.target.closest('.vocab-word')) {
                    document.querySelectorAll('.vocab-word.active').forEach(v => v.classList.remove('active'));
                }
            });
        }


        // Toggle Edit Mode - Updated for "Saving..." Indicator (Blocking Save)
        async function toggleDayEditMode(monthId, weekId, daySection, enterEditMode) {
             const dayIndex = parseInt(daySection.dataset.dayIndex);
             const tableBody = daySection.querySelector('tbody');
             const editButton = daySection.querySelector('.edit-day-btn'); 
             const saveButton = daySection.querySelector('.save-day-btn'); 
             const editModeControls = daySection.querySelector('.edit-mode-controls');
             const deleteDayButton = daySection.querySelector('.delete-day-btn');
             const actionsHeader = daySection.querySelector('.actions-header');
             const completionPercHeader = daySection.querySelector('.completion-perc-header');

             setSyncStatus("Syncing...", "yellow");

             if (enterEditMode) {
                 // --- ENTERING EDIT MODE ---
                 daySection.classList.add('editing');
				 daySection.classList.remove('is-collapsed'); 
                 editButton.classList.add('hidden'); 
                 editModeControls.classList.remove('hidden'); 
                 deleteDayButton.classList.remove('hidden');
                 actionsHeader.classList.remove('hidden');
                 completionPercHeader.classList.remove('hidden');

                 // --- LOAD DATA ---
                 let dayData = null;
                 if (activeWeeksDataCache && activeWeeksDataCache[weekId] && activeWeeksDataCache[weekId].days) {
                     dayData = activeWeeksDataCache[weekId].days[dayIndex];
                 }

                 if (!dayData) {
                     console.warn("Cache miss. Fetching from network...");
                     const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                     const weekDocSnap = await getDoc(weekDocRef);
                     dayData = weekDocSnap.exists() ? weekDocSnap.data().days[dayIndex] : null;
                 }
                 
                 if (!dayData) { console.error("Could not find day data to edit."); setSyncStatus("Error", "red"); return; }

                 tableBody.innerHTML = dayData.rows.map((rowData, rowIndex) =>
                    createTableRow(monthId, weekId, dayIndex, rowIndex, rowData, true) 
                 ).join('');
                 
                daySection.querySelectorAll('.completion-checkbox').forEach(cb => cb.disabled = true);
                 setSyncStatus("Editing...", "blue");
             }

			else {
                 // --- SAVING AND EXITING (INSTANT / OPTIMISTIC) ---
                 
                 // 1. Stop autosave
                 if (autosaveTimer) clearTimeout(autosaveTimer);
                 if (daySection.autosaveHandler) {
                     daySection.removeEventListener('input', daySection.autosaveHandler);
                     daySection.autosaveHandler = null;
                 }
                 
                 // 2. Parse Data Immediately
                 const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);
                 const parseResult = await parseAndPrepareSaveData(daySection, weekId);
                 
                 if (parseResult === null) {
                     setSyncStatus("Error", "red");
                     return; 
                 }
                 
                 const { updatedRows, updatePayload } = parseResult;

                 // 3. Update Cache INSTANTLY
                 if (activeWeeksDataCache && activeWeeksDataCache[weekId]) {
                     activeWeeksDataCache[weekId].days = updatePayload.days;
                 }

                 // 4. Update UI INSTANTLY (Don't wait for internet)
                 daySection.classList.remove('editing');
                 daySection.classList.remove('is-collapsed'); 
                 
                 editButton.classList.remove('hidden'); 
                 editModeControls.classList.add('hidden');
                 deleteDayButton.classList.add('hidden');
                 actionsHeader.classList.add('hidden');
                 completionPercHeader.classList.add('hidden');

                 // Redraw the table in Read-Only mode immediately
                 tableBody.innerHTML = updatedRows.map((rowData, rowIndex) =>
                    createTableRow(monthId, weekId, dayIndex, rowIndex, rowData, false)
                 ).join('');
                 
                 // Update progress bars
                 const dayDataForProgress = { rows: updatedRows };
                 updateDailyProgressUI(monthId, weekId, dayIndex, dayDataForProgress);
                 
                 // Reset Save Button State
                 saveButton.innerHTML = `<i class="fas fa-save mr-1"></i> Save`;
                 saveButton.disabled = false;
                 
                 daySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                 // 5. Send to Firebase in BACKGROUND (No await)
                 // This allows the user to continue working while we upload silently
                 setSyncStatus("Syncing...", "yellow");
                 
                 saveDataToFirebase(monthDocRef, updatePayload, true, weekId)
                    .then(() => {
                        console.log("Background save complete.");
                        setSyncStatus("Synced", "green");
                    })
                    .catch((error) => {
                        console.error("Background save failed:", error);
                        showCustomAlert("Save failed! Please check your connection.", "error");
                        setSyncStatus("Error", "red");
                    });
             }
        }
		
		async function parseAndPrepareSaveData(daySection, weekId, isCheckboxClick = false) {
            try {
                const dayIndex = parseInt(daySection.dataset.dayIndex);
                let freshDaysArray = [];
                
                // 1. Try Reading from Cache (Robust Check)
                if (typeof activeWeeksDataCache !== 'undefined' && 
                    activeWeeksDataCache[weekId] && 
                    activeWeeksDataCache[weekId].days &&
                    activeWeeksDataCache[weekId].days[dayIndex]
                   ) {
                    freshDaysArray = JSON.parse(JSON.stringify(activeWeeksDataCache[weekId].days));
                } 
                else {
                    // 2. Fallback to Network
                    console.log(`Cache miss for Day ${dayIndex}. Fetching from network...`);
                    const monthId = daySection.closest('.card[data-month-id]').dataset.monthId;
                    const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                    const weekDocSnap = await getDoc(weekDocRef);
                    
                    if (weekDocSnap.exists()) {
                        freshDaysArray = weekDocSnap.data().days || [];
                        // Refill cache
                        if (typeof activeWeeksDataCache === 'undefined') activeWeeksDataCache = {};
                        if (!activeWeeksDataCache[weekId]) activeWeeksDataCache[weekId] = {};
                        activeWeeksDataCache[weekId].days = freshDaysArray;
                    } else {
                        throw new Error("Week document not found.");
                    }
                }
                
                const currentDayData = freshDaysArray[dayIndex];
                if (!currentDayData) {
                    throw new Error(`Day data for index ${dayIndex} not found.`);
                }
                
                const updatedRows = [];
                const rowElements = daySection.querySelectorAll('tbody tr');

                rowElements.forEach((row) => {
                    let existingRowIndex = parseInt(row.dataset.rowIndex);
                    const existingRowData = (!isNaN(existingRowIndex) && existingRowIndex !== -1 && currentDayData.rows?.[existingRowIndex]) 
                        ? currentDayData.rows[existingRowIndex] 
                        : {};

                    let subject, topic, comment, completed, completionPercentage, vocabData = null, story, mcqData = null;

                    if (daySection.classList.contains('editing') && !isCheckboxClick) {
                         subject = (row.querySelector('.subject-input')?.value || '').trim();
                         comment = (row.querySelector('.comment-input')?.value || '').trim();
                         completed = existingRowData.completed || false;
                         const percInput = row.querySelector('.completion-perc-input')?.value;
                         completionPercentage = parsePercentage(percInput);
                         story = (subject.toLowerCase() === 'vocabulary') ? (existingRowData.story || null) : null;
                         
                         const mcqBtn = row.querySelector('.add-row-mcq-btn');
                         if (mcqBtn && mcqBtn.dataset.tempMcq) {
                             mcqData = JSON.parse(mcqBtn.dataset.tempMcq);
                         } else {
                             mcqData = existingRowData.mcqData || null;
                         }

                         if (row.classList.contains('vocab-row')) {
                             subject = 'Vocabulary';
                             vocabData = [];
                             row.querySelectorAll('.vocab-pair').forEach(pairEl => {
                                 const word = pairEl.querySelector('.vocab-word-input')?.value.trim();
                                 const meaning = pairEl.querySelector('.vocab-meaning-input')?.value.trim();
                                 if (word) { vocabData.push({ word: word, meaning: meaning || '' }); }
                             });
                             topic = null;
                         } else {
                             topic = (row.querySelector('.topic-input')?.value || '').trim();
                             vocabData = null;
                         }
                    } else { 
                         completed = row.querySelector('.completion-checkbox')?.checked || false;
                         subject = existingRowData.subject; 
                         topic = existingRowData.topic; 
                         comment = existingRowData.comment;
                         completionPercentage = existingRowData.completionPercentage; 
                         vocabData = existingRowData.vocabData; 
                         story = existingRowData.story;
                         mcqData = existingRowData.mcqData; 
                     }
                     
                     updatedRows.push({ subject: subject || '', topic: topic || null, comment: comment || '', completed: completed || false, completionPercentage: completionPercentage ?? null, vocabData: vocabData || null, story: story || null, mcqData: mcqData || null });
                });
                
                freshDaysArray[dayIndex].rows = updatedRows;
                const updatePayload = { days: freshDaysArray };
                
                return { updatedRows, updatePayload };

            } catch (error) {
                console.error("Error parsing day plan from DOM:", error);
                showCustomAlert("Error reading data. Cannot save.", "error");
                return null;
            }
        }
		
		
       /**
         * Step 2: Save to Database (UPDATED: Accepts explicit WeekID)
         */
        async function saveDataToFirebase(monthDocRef, updatePayload, isAutosave = false, passedWeekId = null) {
            try {
                if (!isAutosave) {
                    setSyncStatus("Syncing...", "yellow");
                }
                
                const editingDay = document.querySelector('.day-section.editing, .day-section.saving'); 
                
                let weekId = passedWeekId; // 1. Use passed ID if available
                let dayIndexForTimestamp = null;
                let wasCheckboxClick = false;

                // 2. If no ID passed, try to determine from context
                if (!weekId) {
                    if (isAutosave && editingDay) {
                        // Autosave from typing
                        weekId = editingDay.closest('.week-section').dataset.weekId;
                    } else if (isCheckboxClickGlobal) { 
                        // Checkbox click
                        weekId = isCheckboxClickGlobal.weekId;
                        dayIndexForTimestamp = isCheckboxClickGlobal.dayIndex;
                        wasCheckboxClick = true;
                        isCheckboxClickGlobal = null; 
                    } else {
                        // Manual Save (Fallback for old logic)
                        const savingDay = document.querySelector('.day-section.saving');
                        if (savingDay) {
                            weekId = savingDay.closest('.week-section').dataset.weekId;
                            savingDay.classList.remove('saving'); 
                        } else if (editingDay) {
                            // Support blocking save where class is still 'editing'
                            weekId = editingDay.closest('.week-section').dataset.weekId;
                        }
                    }
                }

                if (!weekId) {
                    throw new Error("Could not determine weekId for save operation.");
                }

                // --- PARALLEL SAVE ---
                const savePromises = [];
                const weekDocRef = doc(db, monthDocRef.path, 'weeks', weekId);
                savePromises.push( updateDoc(weekDocRef, updatePayload) );
                
                if (wasCheckboxClick) {
                    const monthUpdatePayload = { 
                        lastCompletedDay: { 
                            timestamp: Timestamp.now(), 
                            weekId: weekId, 
                            dayIndex: dayIndexForTimestamp 
                        } 
                    };
                    savePromises.push( updateDoc(monthDocRef, monthUpdatePayload) );
                }

                await Promise.all(savePromises);
                
                // Update Cache
				if (activeWeeksDataCache && activeWeeksDataCache[weekId]) {
                    if (updatePayload.days) {
                        activeWeeksDataCache[weekId].days = updatePayload.days;
                        console.log("Global cache updated with saved data.");
                    }
                }
				
                if (wasCheckboxClick) console.log("Updated lastCompletedDay timestamp.");
                
                console.log("Save successful.");
                if (!isAutosave) {
                    setSyncStatus("Synced", "green");
                }
            } catch (error) {
                console.error("Error saving day plan to Firebase:", error);
                showCustomAlert("Error saving changes. Please check your connection.", "error");
                setSyncStatus("Error", "red");
                throw error; // Re-throw so the caller knows it failed
            }
        }
	
	// Missing Function: Handles Autosave (Background Save without UI toggle)
        async function saveDayPlan(monthId, weekId, daySection, isAutosave = true) {
            try {
                // 1. Parse data from DOM
                const parseResult = await parseAndPrepareSaveData(daySection, weekId);
                if (!parseResult) return;

                const { updatedRows, updatePayload } = parseResult;

                // 2. Update Cache Instantly (Crucial for Autosave too)
                if (activeWeeksDataCache && activeWeeksDataCache[weekId]) {
                    activeWeeksDataCache[weekId].days = updatePayload.days;
                }

                // 3. Save to Firebase
                const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);
                await saveDataToFirebase(monthDocRef, updatePayload, isAutosave);

            } catch (error) {
                console.error("Autosave failed:", error);
            }
        }
        

         // Add Row (normal or vocab)
        function addRowToDay(monthId, weekId, daySection, type = 'normal') {
             const dayIndex = parseInt(daySection.dataset.dayIndex);
             const tableBody = daySection.querySelector('tbody');
             let maxIndex = -1;
             tableBody.querySelectorAll('tr').forEach(tr => { const idx = parseInt(tr.dataset.rowIndex); if (idx > maxIndex) maxIndex = idx; });
             const newRowIndex = maxIndex + 1;

             let newRowData;
             if (type === 'vocabulary') { newRowData = { subject: 'Vocabulary', topic: null, completed: false, comment: '', completionPercentage: null, vocabData: [{ word: '', meaning: '' }], story: null }; }
             else { newRowData = { subject: '', topic: '', completed: false, comment: '', completionPercentage: null, vocabData: null, story: null }; }

             const newRowHtml = createTableRow(monthId, weekId, dayIndex, newRowIndex, newRowData, true);
             tableBody.insertAdjacentHTML('beforeend', newRowHtml);
         }

        // Add/Delete Vocab Pair Inputs
function addVocabPairInputs(container, word = '', meaning = '') {
             console.log("Checkpoint 8: addVocabPairInputs called with:", word, meaning);
             const newPairIndex = container.querySelectorAll('.vocab-pair').length;
             const pairHtml = `<div class="vocab-pair" data-pair-index="${newPairIndex}">
                                 <input type="text" class="vocab-input vocab-word-input" placeholder="Word" value="${escapeHtml(word)}">
                                 <input type="text" class="vocab-input vocab-meaning-input" placeholder="Meaning" value="${escapeHtml(meaning)}">
                                 <button type="button" class="icon-button delete-vocab-pair-btn" title="Delete Pair"><i class="fas fa-times text-red-500"></i></button>
                             </div>`;

             // --- ROBUST FIX ---
             // Find the specific button container div we just named
             const buttonContainer = container.querySelector('.vocab-button-container');
             
             if (buttonContainer) {
                 console.log("Checkpoint 9: Found button container, inserting HTML.");
                 // Insert the new pair *before* that button container
                 buttonContainer.insertAdjacentHTML('beforebegin', pairHtml);
             } else {
                 // This will now show a RED error if it fails
                 console.error("CRITICAL: Could not find '.vocab-button-container' to insert new pair.");
             }
         }
         function deleteVocabPairInputs(pairElement) {
             const container = pairElement.closest('.vocab-edit-container');
             if (container && container.querySelectorAll('.vocab-pair').length > 1) { pairElement.remove(); }
             else { showCustomAlert("Cannot delete the last word/meaning pair."); }
         }
		 
		 // --- NEW Vocab Code Modal Functions ---

        function openVocabCodeModal(vocabContainer) {
            console.log("Checkpoint 4: openVocabCodeModal called.");
            if (!vocabContainer) {
                console.error("CRITICAL: openVocabCodeModal was called with a NULL container. Target will not be set.");
                // We still show the modal, but it won't work
            }
            currentVocabCodeTarget = vocabContainer;
            console.log("Checkpoint 5: currentVocabCodeTarget set to:", currentVocabCodeTarget);
            document.getElementById('vocab-code-textarea').value = ''; // Clear textarea
            document.getElementById('vocab-code-modal').style.display = "block";
            document.getElementById('vocab-code-textarea').focus();
        }

        function closeVocabCodeModal() {
            document.getElementById('vocab-code-modal').style.display = "none";
            document.getElementById('vocab-code-textarea').value = '';
            currentVocabCodeTarget = null;
        }

        function handleSaveVocabCode() {
            console.log("Checkpoint 6: 'Save & Add Pairs' button clicked. handleSaveVocabCode FIRED.");
            
            if (!currentVocabCodeTarget) {
                console.error("CRITICAL: Save failed because currentVocabCodeTarget is NULL.");
                return;
            }
            
            console.log("Checkpoint 7: Save function has a valid target:", currentVocabCodeTarget);
            const container = currentVocabCodeTarget;
            const text = document.getElementById('vocab-code-textarea').value.trim();
            if (!text) {
                console.log("Text area is empty. Closing modal.");
                closeVocabCodeModal();
                return;
            }

            // Check if the last pair is empty and remove it, so we don't have an empty row.
            const allPairs = container.querySelectorAll('.vocab-pair');
            if (allPairs.length > 0) {
                const lastPair = allPairs[allPairs.length - 1];
                const lastWordInput = lastPair.querySelector('.vocab-word-input');
                const lastMeaningInput = lastPair.querySelector('.vocab-meaning-input');
                if (lastWordInput.value.trim() === '' && lastMeaningInput.value.trim() === '') {
                    lastPair.remove();
                }
            }

            console.log("Parsing text:", text);
            const pairs = text.split(';');

            // --- REPLACED LOGIC ---
            pairs.forEach(pairStr => {
                const pair = pairStr.trim();
                if (pair) {
                    let word = '';
                    let meaning = '';
                    
                    const commaIndex = pair.indexOf(',');

                    if (commaIndex === -1) {
                        // No comma found, treat the whole thing as a word
                        word = pair.trim();
                    } else {
                        // Comma found, split into word and meaning
                        word = pair.substring(0, commaIndex).trim();
                        meaning = pair.substring(commaIndex + 1).trim();
                    }

                    if (word) { // Check if the word is not empty
                        console.log("Adding pair:", word, meaning); 
                        addVocabPairInputs(container, word, meaning);
                    }
                }
            });
            // --- END REPLACED LOGIC ---

            // Add one new empty pair for the user to manually add more
            addVocabPairInputs(container, '', '');

            closeVocabCodeModal();
        }
        // Add listener for the new modal's save button
        document.getElementById('save-vocab-code-btn').addEventListener('click', handleSaveVocabCode);

        // --- Delete Operations ---
         function confirmDeleteRow(monthId, weekId, daySection, rowElement) {
             const rowIndex = parseInt(rowElement.dataset.rowIndex);
             showConfirmationModal("Delete Row", "Are you sure you want to delete this row? This action cannot be undone.", () => deleteRow(monthId, weekId, daySection, rowElement, rowIndex));
         }
         async function deleteRow(monthId, weekId, daySection, rowElement, rowIndex) {
            rowElement.remove(); // Remove from UI
            console.log("Row removed from UI. Awaiting final save.");
            setSyncStatus("Unsaved changes", "yellow"); // Show that changes are pending

            // --- Database save removed. The save will happen when the user clicks the main 'Save' button. ---

            // Re-index remaining rows in the UI so the save function works correctly
            daySection.querySelectorAll('tbody tr').forEach((tr, newIdx) => {
                tr.dataset.rowIndex = newIdx;
                tr.id = `row-${monthId}-${weekId}-${daySection.dataset.dayIndex}-${newIdx}`;
            });
         }
         function confirmDeleteDay(monthId, weekId, daySection) {
             const dayIndex = parseInt(daySection.dataset.dayIndex);
             const dayNum = daySection.querySelector('h4').textContent;
             showConfirmationModal(`Delete ${dayNum}`, `Are you sure you want to delete all entries for ${dayNum}? This action cannot be undone.`, () => deleteDay(monthId, weekId, daySection, dayIndex));
         }
		 
         // Delete Day (UPDATED: Robust Cache-Aware)
         async function deleteDay(monthId, weekId, daySection, dayIndex) {
            if (!currentUser || !userId) return;
            
            const weekSection = daySection.closest('.week-section');
            setSyncStatus("Deleting...", "yellow");
            
            try {
                // 1. GET DATA (Try Cache First, then Network)
                let daysArray = [];
                
                // Try Cache
                if (activeWeeksDataCache && activeWeeksDataCache[weekId] && activeWeeksDataCache[weekId].days) {
                    // Deep copy to avoid reference issues
                    daysArray = JSON.parse(JSON.stringify(activeWeeksDataCache[weekId].days));
                } else {
                    // Fallback to Network
                    const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                    const weekDocSnap = await getDoc(weekDocRef);
                    if (weekDocSnap.exists()) {
                        daysArray = weekDocSnap.data().days || [];
                    }
                }

                // 2. VALIDATE & MODIFY
                if (!daysArray[dayIndex]) {
                     console.warn("Day index not found in data. UI might be out of sync.");
                     daySection.remove(); // Just remove UI element
                     setSyncStatus("Synced", "green");
                     return; 
                }

                // Remove the day
                daysArray.splice(dayIndex, 1);

                // Renumber remaining days
                daysArray.forEach((day, idx) => {
                    day.dayNumber = idx + 1;
                });

                // 3. SAVE TO FIREBASE
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                await updateDoc(weekDocRef, { days: daysArray });

                // 4. UPDATE CACHE INSTANTLY (Crucial Step)
                if (activeWeeksDataCache && activeWeeksDataCache[weekId]) {
                    activeWeeksDataCache[weekId].days = daysArray;
                }

                // 5. UPDATE UI (Re-render container to fix numbers)
                const daysContainer = weekSection.querySelector('.days-container');
                if (daysContainer) {
                    daysContainer.innerHTML = ''; // Clear
                    if (daysArray.length === 0) {
                        daysContainer.innerHTML = '<p class="text-gray-500 italic text-sm py-4 text-center">No days added yet.</p>';
                    } else {
                        daysArray.forEach((dayData, idx) => {
                            daysContainer.insertAdjacentHTML('beforeend', createDayElement(monthId, weekId, idx, dayData));
                        });
                    }
                }

                // Update "Add Day" button visibility
                const buttonContainer = weekSection.querySelector('.days-container').nextElementSibling;
                let newButtonHtml = '';
                if (daysArray.length < 7) {
                     if (daysArray.length > 0) {
                         newButtonHtml = `<button class="add-day-btn w-full mt-4" data-week-id="${weekId}"><i class="fas fa-plus"></i> Add New Day</button>`;
                     } else {
                         newButtonHtml = `<button class="action-button mt-4 add-first-day-btn" data-week-id="${weekId}"><i class="fas fa-calendar-plus mr-2"></i> Add First Day</button>`;
                     }
                } else {
                     newButtonHtml = '<p class="text-center text-xs text-gray-400 mt-4">Maximum 7 days reached for this week.</p>';
                }
                if (buttonContainer) {
                     buttonContainer.outerHTML = newButtonHtml;
                }

                setSyncStatus("Deleted", "green");
                console.log("Day deleted and re-indexed successfully.");

            } catch (error) {
                console.error("Error deleting day:", error); 
                showCustomAlert("Error deleting day. Please refresh.", "error"); 
                setSyncStatus("Error", "red");
            }
         }
		 
		 
         function confirmDeleteMonth(monthId, monthName) {
             showConfirmationModal(
                 `Delete Month: ${monthName}`, 
                 `Are you sure you want to delete ${monthName}? This action cannot be undone.`, 
                 () => {
                     // ধাপ ১ শেষ। এখন ধাপ ২ চালু করুন।
                     showDeleteMonthSecondStep(monthId, monthName);
                 }
             );
         }
         async function deleteMonth(monthId) {
             if (!currentUser || !userId) return;
             console.log("Attempting to delete month:", monthId);
             setSyncStatus("Syncing...", "yellow");
             
             // --- START: NEW LOGIC ---
             let monthToLoad = null;
             const buttonToDelete = monthNavButtonsContainer.querySelector(`button[data-month-id="${monthId}"]`);
             
             if (buttonToDelete) {
                 // Find the previous button that is a month button (not the "Add Month" button)
                 let prevButton = buttonToDelete.previousElementSibling;
                 while(prevButton && !prevButton.dataset.monthId) {
                     prevButton = prevButton.previousElementSibling;
                 }
                 
                 // Find the next button that is a month button
                 let nextButton = buttonToDelete.nextElementSibling;
                 while(nextButton && !nextButton.dataset.monthId) {
                     nextButton = nextButton.nextElementSibling;
                 }

                 if (prevButton && prevButton.dataset.monthId) {
                     // Prefer loading the previous month
                     monthToLoad = prevButton.dataset.monthId;
                 } else if (nextButton && nextButton.dataset.monthId) {
                     // Otherwise, load the next month
                     monthToLoad = nextButton.dataset.monthId;
                 }
                 // If no neighbor, monthToLoad remains null
             }
             
             // Unsubscribe if we are deleting the active month
             const activeBtn = monthNavButtonsContainer.querySelector('button.active-month');
             if (activeBtn && activeBtn.dataset.monthId === monthId && unsubscribeActiveMonth) { 
                 unsubscribeActiveMonth(); 
                 unsubscribeActiveMonth = null; 
             }
             // --- END: NEW LOGIC ---

             const docRef = doc(db, getUserPlansCollectionPath(), monthId);
             try { 
                 await deleteDoc(docRef); 
                 console.log("Month deleted successfully."); 
                 setSyncStatus("Synced", "green"); 
                 
                 // --- START: NEW LOADING LOGIC ---
                 if (monthToLoad) {
                     // Explicitly load the neighbor month.
                     // The database listener will update the buttons,
                     // but this ensures the correct month is displayed.
                     displayMonthPlan(monthToLoad); 
                 } else {
                     // It was the only month. Clear the display.
                     // The database listener will show the "No plans" message.
                     currentMonthPlanDisplay.innerHTML = '';
                     selectMonthMessage.classList.add('hidden');
                     noPlansMessage.style.display = 'block';
                 }
                 // --- END: NEW LOADING LOGIC ---
                 
             }
             catch (error) { 
                 console.error("Error deleting month:", error); 
                 showCustomAlert("Error deleting month. Please try again."); 
                 setSyncStatus("Error", "red"); 
             }
         }
         function showConfirmationModal(title, message, onConfirm) {
             confirmModalTitle.textContent = title; confirmModalMessage.textContent = message; currentConfirmAction = onConfirm;
             confirmModalConfirmBtn.onclick = () => { if (currentConfirmAction) currentConfirmAction(); closeModal('confirm-modal'); };
             confirmModalCancelBtn.onclick = () => closeModal('confirm-modal');
             confirmModal.style.display = 'block';
         }

       /// Add New Day (UPDATED: Updates Cache Instantly)
        async function addNewDay(monthId, weekId, weekSection) {
            if (!currentUser || !userId) return;
            
            setSyncStatus("Syncing...", "yellow");
            
            const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
             
            try {
                 const weekDocSnap = await getDoc(weekDocRef);
                 let daysArray = [];
                 
                 if (weekDocSnap.exists()) {
                     daysArray = weekDocSnap.data().days || [];
                 }
                 
                 if (daysArray.length >= 7) { 
                     showCustomAlert("You cannot add more than 7 days to a week."); 
                     setSyncStatus("Synced", "green"); 
                     return; 
                 }

                 let sourceRows = [];

                // Determine Source Data
                 if (daysArray.length > 0) {
                     // CASE 1: Copy from yesterday (Same Week)
                     sourceRows = daysArray[daysArray.length - 1].rows || [];
                 } else {
                     const currentWeekNum = parseInt(weekId.replace('week', '')); 
                     
                     if (currentWeekNum > 1) {
                         // CASE 2: Copy from previous week (Same Month)
                         const prevWeekId = `week${currentWeekNum - 1}`;
                         const prevWeekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', prevWeekId);
                         const prevWeekSnap = await getDoc(prevWeekDocRef);
                         if (prevWeekSnap.exists()) {
                             const prevDays = prevWeekSnap.data().days || [];
                             if (prevDays.length > 0) {
                                 sourceRows = prevDays[prevDays.length - 1].rows || [];
                             }
                         }
                     } else {
                         // CASE 3: Copy from Previous Month (New Feature)
                         // We are in Week 1. Look for Week 4 of the previous month.
                         try {
                             const parts = monthId.split('-'); // e.g., "2025-11"
                             let y = parseInt(parts[0]);
                             let m = parseInt(parts[1]);
                             
                             // Calculate previous month ID
                             m = m - 1;
                             if (m === 0) { m = 12; y = y - 1; }
                             const prevMonthId = `${y}-${m.toString().padStart(2, '0')}`;
                             
                             // Fetch Week 4 of previous month
                             const prevMonthWeekRef = doc(db, getUserPlansCollectionPath(), prevMonthId, 'weeks', 'week4');
                             const prevMonthWeekSnap = await getDoc(prevMonthWeekRef);
                             
                             if (prevMonthWeekSnap.exists()) {
                                 const prevMDays = prevMonthWeekSnap.data().days || [];
                                 if (prevMDays.length > 0) {
                                     // Get the last day of that week
                                     sourceRows = prevMDays[prevMDays.length - 1].rows || [];
                                     console.log(`Auto-copied data from previous month: ${prevMonthId}`);
                                 }
                             }
                         } catch(err) {
                             console.log("Could not fetch previous month data, starting fresh.", err);
                         }
                     }
                 }

                 if (sourceRows.length === 0) {
                     sourceRows = [{ subject: '', topic: '', completed: false, comment: '', completionPercentage: null, vocabData: null, story: null }];
                 }

                 const newDayIndex = daysArray.length;
                 const newDayData = { 
                     dayNumber: newDayIndex + 1, 
                     date: '', 
                     rows: sourceRows.map(row => ({ 
                         subject: row.subject || '', 
                         topic: (row.subject?.toLowerCase() === 'vocabulary') ? null : (row.topic || ''), 
                         completed: false, 
                         comment: row.comment || '', 
                         completionPercentage: row.completionPercentage ?? null, 
                         vocabData: (row.subject?.toLowerCase() === 'vocabulary') ? (row.vocabData || null) : null, 
                         story: null 
                     })) 
                 };
                 
                 // 1. Update Firebase
                 if (weekDocSnap.exists()) {
                     await updateDoc(weekDocRef, { days: arrayUnion(newDayData) });
                 } else {
                     await setDoc(weekDocRef, { days: [newDayData] });
                 }

                 // 2. --- NEW: Update Global Cache Instantly ---
                 if (activeWeeksDataCache && activeWeeksDataCache[weekId]) {
                     if (!activeWeeksDataCache[weekId].days) activeWeeksDataCache[weekId].days = [];
                     activeWeeksDataCache[weekId].days.push(newDayData);
                     console.log("Global cache updated with new day.");
                 }
                 // --------------------------------------------
                 
                 console.log("New day added successfully.");
                 
                 // UI Updates
                 const newDayHtml = createDayElement(monthId, weekId, newDayIndex, newDayData);
                 const daysContainer = weekSection.querySelector('.days-container');
                 if (!daysContainer) return;

                 if (newDayIndex === 0) {
                     daysContainer.innerHTML = '';
                 }
                 
                 daysContainer.insertAdjacentHTML('beforeend', newDayHtml);

                 const totalDays = newDayIndex + 1;
                 const buttonContainer = weekSection.querySelector('.days-container').nextElementSibling;
                 let newButtonHtml = '';
                 if (totalDays < 7) {
                     newButtonHtml = `<button class="add-day-btn w-full mt-4" data-week-id="${weekId}"><i class="fas fa-plus"></i> Add New Day</button>`;
                 } else {
                     newButtonHtml = '<p class="text-center text-xs text-gray-400 mt-4">Maximum 7 days reached for this week.</p>';
                 }
                 if (buttonContainer) {
                     buttonContainer.outerHTML = newButtonHtml;
                 }

                 const newDayElement = daysContainer.querySelector(`[data-day-index="${newDayIndex}"]`);
                 if (newDayElement) {
                     const monthElement = newDayElement.closest('.card[data-month-id]');
                     if (monthElement) {
                        monthElement.querySelectorAll('.day-section:not(.is-collapsed)').forEach(openDay => {
                            openDay.classList.add('is-collapsed');
                        });
                     }
                     newDayElement.classList.remove('is-collapsed');
                     newDayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
                 
                 setSyncStatus("Synced", "green");
                 
             } catch (error) { 
                 console.error("Error adding new day:", error); 
                 showCustomAlert("Error adding new day.", "error"); 
                 setSyncStatus("Error", "red"); 
             }
        }
		
		
        // --- Monthly Target Edit ---
        function handleEditTargets(button, monthId) {
            const isEditing = button.dataset.editing === 'true';
            
            // --- THIS IS THE FIX ---
            // We go back to finding the main parent container
            const targetsParent = button.closest('.mb-8'); 
            // Find the grid *inside* the parent
            const targetsGrid = targetsParent.querySelector('.monthly-targets'); 
            // Find the links *inside* the parent
            const links = targetsParent.querySelectorAll('.target-card-link'); 
            // Find the textareas *inside* the parent
            const textareas = targetsParent.querySelectorAll('.target-textarea'); 
            
            // Define the input handler to use the grid
            const onInput = () => syncTextareaHeights(targetsGrid);

            if (isEditing) {
                // --- SAVING ---
                saveMonthlyTargets(monthId, targetsGrid); // Pass the grid
                button.innerHTML = '<i class="fas fa-pencil-alt mr-1"></i> Edit Targets';
                button.dataset.editing = 'false';
                button.classList.add('action-button-secondary');
                
                textareas.forEach(ta => {
                    ta.disabled = true;
                    ta.removeEventListener('input', onInput);
                });
                
                syncTextareaHeights(targetsGrid); // Pass the grid
                
                // This will work now because 'links' is found correctly
                links.forEach(link => { 
                    if (link.dataset.href) { 
                        link.setAttribute('href', link.dataset.href); 
                    } 
                });
            } else {
                // --- EDITING ---
                button.innerHTML = '<i class="fas fa-save mr-1"></i> Save Targets';
                button.dataset.editing = 'true';
                button.classList.remove('action-button-secondary');
                
                // This will work now because 'links' is found correctly
                links.forEach(link => { 
                    link.dataset.href = link.getAttribute('href'); 
                    link.removeAttribute('href'); 
                });
                
                textareas.forEach(ta => {
                    ta.disabled = false;
                    ta.addEventListener('input', onInput);
                });
                
                syncTextareaHeights(targetsGrid); // Pass the grid
                
                textareas[0].focus();
            }
        }
        async function saveMonthlyTargets(monthId, targetsContainer) {
             if (!currentUser || !userId) return;
             console.log("Saving targets for month:", monthId);
             setSyncStatus("Syncing...", "yellow");
             const targets = {};
             targetsContainer.querySelectorAll('.target-textarea').forEach(textarea => { targets[textarea.dataset.week] = textarea.value.trim(); });
             const docRef = doc(db, getUserPlansCollectionPath(), monthId);
             try { 
                 await updateDoc(docRef, { weeklyTargets: targets }); 
                 console.log("Monthly targets saved."); 
                 showCustomAlert("Monthly targets saved!", "success"); 
                 setSyncStatus("Synced", "green");
                 
                 // --- NEW AUTO-UPDATE LOGIC ---
                 // Manually update the text in the week sections
                 for (const weekId in targets) {
                     const targetTextElement = document.getElementById(`target-text-${monthId}-${weekId}`);
                     if (targetTextElement) {
                         targetTextElement.innerHTML = escapeHtml(targets[weekId]);
                     }
                 }
                 // --- END NEW LOGIC ---
                 
             }
             catch (error) { console.error("Error saving targets:", error); showCustomAlert("Error saving targets."); setSyncStatus("Error", "red"); }
        }

        // --- Story Modals ---
         async function openEditStoryModal(monthId, weekId, dayIndex, vocabRowIndex) {
             if (!currentUser || !userId) return;
             
             let existingStory = ''; 
             setSyncStatus("Loading...", "blue"); 
             
             try {
                 // --- START: MODIFIED ---
                 const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                 const weekDocSnap = await getDoc(weekDocRef);
                 // --- END: MODIFIED ---
                 
                 let dayData;
                 
                 if (weekDocSnap.exists()) {
                     dayData = weekDocSnap.data().days?.[dayIndex];
                     
                     if (dayData && dayData.rows && dayData.rows[vocabRowIndex]) {
                         existingStory = dayData.rows[vocabRowIndex].story || ''; 
                     }
                 }
                 
                 setSyncStatus("Synced", "green"); 
                 currentStoryTarget = { monthId, weekId, dayIndex, rowIndex: vocabRowIndex };
                 document.getElementById('story-textarea').value = existingStory; 
                 editStoryModal.style.display = "block";
                 document.getElementById('story-textarea').focus();
                 
             } catch (error) { 
                 console.error("Error fetching/prepping story:", error); 
                 showCustomAlert("Could not open story editor. A database error occurred."); 
                 setSyncStatus("Error", "red"); 
             }
         }
         
		 
		saveStoryBtn.addEventListener('click', () => { 
             if (!currentUser || !userId || !currentStoryTarget) return;
             
             const { monthId, weekId, dayIndex, rowIndex } = currentStoryTarget;
             if (rowIndex === -1) { 
                 showCustomAlert("Error: No associated vocabulary row found."); 
                 return; 
             }
             
             const newStory = document.getElementById('story-textarea').value.trim();
             
             closeModal('edit-story-modal');
             setSyncStatus("Syncing...", "yellow");
             
             const targetToSave = currentStoryTarget; 
             currentStoryTarget = null; 

             (async () => {
                 // --- START: MODIFIED ---
                 const weekDocRef = doc(db, getUserPlansCollectionPath(), targetToSave.monthId, 'weeks', targetToSave.weekId);
                 // --- END: MODIFIED ---
                 
                 try {
                     const weekDocSnap = await getDoc(weekDocRef); 
                     if (!weekDocSnap.exists()) throw new Error("Week document not found.");
                     
                     let daysArray = weekDocSnap.data().days || [];
                     
                     if (daysArray[targetToSave.dayIndex]?.rows?.[targetToSave.rowIndex]) {
                         daysArray[targetToSave.dayIndex].rows[targetToSave.rowIndex].story = newStory || null;
                         
                         // Update the WEEK document
                         await updateDoc(weekDocRef, { days: daysArray });
                         
                         console.log("Story saved successfully in background for row:", targetToSave.rowIndex);
                         setSyncStatus("Synced", "green");
                         showCustomAlert("Story saved!", "success");

                         const daySection = document.querySelector(`[data-month-id="${targetToSave.monthId}"] [data-week-id="${targetToSave.weekId}"] [data-day-index="${targetToSave.dayIndex}"]`);
                         if (daySection && !daySection.classList.contains('editing')) {
                             toggleDayEditMode(targetToSave.monthId, targetToSave.weekId, daySection, true);
                         }

                     } else { 
                         throw new Error("Target row for story not found."); 
                     }
                 } catch (error) { 
                     console.error("Error saving story in background:", error); 
                     showCustomAlert("Error saving story."); 
                     setSyncStatus("Error", "red"); 
                 }
             })(); 
         });
		 
         async function readStory(monthId, weekId, dayIndex, rowIndex) {
            if (!currentUser || !userId) return;
            const storyModalContent = document.getElementById('story-modal-content');
            storyModalContent.innerHTML = '<p class="text-gray-500 italic">Loading story...</p>';
            storyModal.style.display = "block";

             try {
                 // --- START: MODIFIED ---
                 const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                 const weekDocSnap = await getDoc(weekDocRef);
                 // --- END: MODIFIED ---
                 
                 if (weekDocSnap.exists()) {
                     const dayData = weekDocSnap.data().days?.[dayIndex];
                     const rowData = dayData?.rows?.[rowIndex];
                     const story = rowData?.story;
                     const vocabData = rowData?.vocabData;

                     if (story) {
                         let highlightedStory = escapeHtml(story);
                         if (vocabData && vocabData.length > 0) {
                             const wordsToHighlight = vocabData
                                 .map(v => v.word?.trim())
                                 .filter(Boolean) 
                                 .sort((a, b) => b.length - a.length); 

                             wordsToHighlight.forEach(word => {
                                 const regex = new RegExp(`\\b(${escapeRegExp(word)})\\b`, 'gi');
                                 highlightedStory = highlightedStory.replace(regex, (match) => {
                                     const surroundingChars = highlightedStory.substring(
                                         Math.max(0, highlightedStory.indexOf(match) - 25),
                                         highlightedStory.indexOf(match) + match.length + 10
                                     );
                                     if (surroundingChars.includes('<span class="highlighted-vocab">')) {
                                         return match; 
                                     }
                                     return `<span class="highlighted-vocab">${match}</span>`;
                                 });
                             });
                         }
                         storyModalContent.innerHTML = highlightedStory.replace(/\n/g, '<br>');

                     } else {
                         storyModalContent.textContent = "No story found for this entry.";
                     }
                 } else {
                     storyModalContent.textContent = "Study plan data not found.";
                 }
             } catch (error) {
                 console.error("Error reading or highlighting story:", error);
                 storyModalContent.textContent = "Could not load or process the story.";
                 showCustomAlert("Could not load story.");
             }
        }

        // Helper function to escape special characters for RegExp
        function escapeRegExp(string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        }

        // --- Other Utility functions ---
		function calculateWeeklyProgress(weekData) {
            if (!weekData || !weekData.days || weekData.days.length === 0) return 0;
            let totalPercentageSum = 0; 
            
            weekData.days.forEach(day => {
                day.rows?.forEach(row => {
                    if (row.completed) {
                        const perc = parsePercentage(row.completionPercentage);
                        if (perc !== null && !isNaN(perc)) {
                             totalPercentageSum += perc;
                        }
                    }
                });
            });
             
             // WEEK CALC: (Sum of Day Percents) / 7
             // Example: 7 days of 100% = 700 total. 700 / 7 = 100% Weekly Progress.
            return Math.round(totalPercentageSum / 7);
        }
		
		
		function calculateDailyProgress(dayData) {
            if (!dayData || !dayData.rows || dayData.rows.length === 0) return 0;
            let totalPercentageSum = 0; 
            
            dayData.rows.forEach(row => {
                if (row.completed) {
                    const perc = parsePercentage(row.completionPercentage);
                    if (perc !== null && !isNaN(perc)) {
                         totalPercentageSum += perc;
                    }
                }
            });
             
            // DIRECT SUM: 20 + 30 + 50 = 100%
            // We cap it at 100 just in case
            return Math.min(100, Math.round(totalPercentageSum));
        }
		
		
		function calculateOverallMonthlyProgress(weeksData) {
            if (!weeksData) return 0;
            
            let total = 0;
            total += calculateWeeklyProgress(weeksData.week1);
            total += calculateWeeklyProgress(weeksData.week2);
            total += calculateWeeklyProgress(weeksData.week3);
            total += calculateWeeklyProgress(weeksData.week4);
            
            // Return the average of the 4 weeks
            return Math.round(total / 4);
        }
		
		function findLastProgressTrackers(monthId, monthData, weeksData) {
            if (!weeksData) {
                return { weekly: 0, daily: 0, link: null };
            }

            // --- START: NEW LOGIC ---
            // Try to find the *last completed* day first
            if (monthData && monthData.lastCompletedDay) {
                const { weekId, dayIndex } = monthData.lastCompletedDay;
                const weekData = weeksData[weekId];
                const dayData = weekData?.days?.[dayIndex];

                if (dayData) {
                    // Found it!
                    console.log("Tracker found last *completed* day:", weekId, dayIndex);
                    const weeklyPercent = calculateWeeklyProgress(weekData);
                    const dailyPercent = calculateDailyProgress(dayData);
                    const continueLink = `#day-${monthId}-${weekId}-${dayIndex}`;
                    return { weekly: weeklyPercent, daily: dailyPercent, link: continueLink };
                }
            }
            // --- END: NEW LOGIC ---

            // --- FALLBACK: Original logic (find last *existing* day) ---
            console.log("Tracker falling back to last *existing* day.");
            let lastWeekData = null;
            let lastDayData = null;
            let lastWeekId = null;
            let lastDayIndex = -1;

            for (const weekId of ['week4', 'week3', 'week2', 'week1']) {
                const weekData = weeksData[weekId];
                if (weekData && weekData.days && weekData.days.length > 0) {
                    lastWeekData = weekData;
                    lastWeekId = weekId;
                    lastDayIndex = weekData.days.length - 1;
                    lastDayData = weekData.days[lastDayIndex];
                    break; 
                }
            }

            if (!lastWeekData) {
                return { weekly: 0, daily: 0, link: null };
            }

            const weeklyPercent = calculateWeeklyProgress(lastWeekData);
            const dailyPercent = calculateDailyProgress(lastDayData);
            const continueLink = `#day-${monthId}-${lastWeekId}-${lastDayIndex}`;

            return { weekly: weeklyPercent, daily: dailyPercent, link: continueLink };
        }
        
        function createTrackerHTML(id, label, percentage, colorStart, colorEnd, continueLink = null) {
            // 'label' is "Monthly Progress", "Last Week", "Last Day"
            // 'percentage' is the value
            
            const continueButton = continueLink 
                ? `<a href="${continueLink}" class="tracker-continue-btn">Continue</a>`
                : ''; // No timestamp

            return `
                <div class="circular" 
                     id="${id}"
                     data-percentage="${percentage}" 
                     data-color-start="${colorStart}" 
                     data-color-end="${colorEnd}">
                    
                    <svg>
                        <circle class="bg"></circle>
                        <circle class="progress"></circle>
                        
                        </svg>
                    
                    <div class="end-cap"></div>
                    
                    <div class="inner-text">
                        <div class="tracker-label-small">${label}</div>
                        
                        <div class="tracker-score">0%</div>
                        
                        ${continueButton}
                    </div>
                </div>
            `;
        }

        function animateTrackers(containerElement) {
            // Find trackers *only* within the newly created month element
            const circles = containerElement.querySelectorAll('.circular');

            circles.forEach(circle => {
                const percentage = +circle.dataset.percentage;
                const score = circle.querySelector('.tracker-score'); 
                const progress = circle.querySelector('.progress');
                const cap = circle.querySelector('.end-cap'); // <-- Find the DIV cap
                const startColor = circle.dataset.colorStart;
                const endColor = circle.dataset.colorEnd;

                // --- NEW cap logic ---
                const radius = 65;
                const center = 75;
                cap.style.borderColor = endColor; // Set cap color
                if (percentage === 0) {
                    cap.style.visibility = 'hidden';
                }
                // --- END NEW ---

                // Animate the number and circle
                let current = 0;
                const circumference = 408; // 2 * PI * 65

                // --- Create and apply gradient (Your code is correct) ---
                const gradientId = `grad-${Math.random().toString(36).substring(2, 9)}`;
                const svg = circle.querySelector('svg');
                const oldDefs = svg.querySelector('defs');
                if (oldDefs) oldDefs.remove();
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                linearGradient.setAttribute('id', gradientId);
                linearGradient.setAttribute('x1', '0%');
                linearGradient.setAttribute('y1', '0%');
                linearGradient.setAttribute('x2', '100%');
                linearGradient.setAttribute('y2', '100%');
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%');
                stop1.setAttribute('stop-color', startColor);
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%');
                stop2.setAttribute('stop-color', endColor);
                linearGradient.appendChild(stop1);
                linearGradient.appendChild(stop2);
                defs.appendChild(linearGradient);
                svg.prepend(defs);
                progress.setAttribute('stroke', `url(#${gradientId})`);
                // --- End gradient ---

                // Clear any existing interval on this element
                if (circle.animationInterval) {
                    clearInterval(circle.animationInterval);
                }
                
                // Start new animation
                const interval = setInterval(() => {
                    if (current >= percentage) {
                        clearInterval(interval);
                        score.textContent = percentage + '%'; 
                        const finalOffset = circumference - (circumference * percentage) / 100;
                        progress.style.strokeDashoffset = finalOffset;
                        
                        // --- SET FINAL CAP POSITION ---
                        const angle = (percentage / 100) * 360;
                        const radians = (angle - 90) * (Math.PI / 180);
                        const x = center + radius * Math.cos(radians);
                        const y = center + radius * Math.sin(radians);
                        cap.style.left = `${x}px`;
                        cap.style.top = `${y}px`;
                        if (percentage > 0) cap.style.visibility = 'visible';

                    } else {
                        current++;
                        const offset = circumference - (circumference * current) / 100;
                        progress.style.strokeDashoffset = offset;
                        score.textContent = current + '%'; 
                        
                        // --- SET LIVE CAP POSITION ---
                        const angle = (current / 100) * 360;
                        const radians = (angle - 90) * (Math.PI / 180);
                        const x = center + radius * Math.cos(radians);
                        const y = center + radius * Math.sin(radians);
                        cap.style.left = `${x}px`;
                        cap.style.top = `${y}px`;
                        if (current > 0) cap.style.visibility = 'visible';
                    }
                }, 20); 
                
                circle.animationInterval = interval; 
            });
        }

       

async function updateDailyProgressUI(monthId, weekId, dayIndex, dayData) {
             if (!currentUser || !userId) return;
             const daySection = document.querySelector(`[data-month-id="${monthId}"] .week-section[data-week-id="${weekId}"] .day-section[data-day-index="${dayIndex}"]`);
             if (!daySection) return;
             
             const progressBarFill = daySection.querySelector('.day-progress-wrapper .progress-bar-fill');
             const progressPercentageSpan = daySection.querySelector('.day-progress-wrapper .progress-percentage');
             if (!progressBarFill || !progressPercentageSpan) return;

             try {
                 let dataToUse = dayData;
                 if (!dataToUse) {
                     console.log(`Daily Progress UI fetching data for day ${dayIndex}...`);
                     const docRef = doc(db, getUserPlansCollectionPath(), monthId); 
                     const docSnap = await getDoc(docRef);
                     if (docSnap.exists()) {
                         dataToUse = docSnap.data().weeks?.[weekId]?.days?.[dayIndex];
                     }
                 }

                 if (dataToUse) {
                    const progress = calculateDailyProgress(dataToUse);
                    progressBarFill.style.width = `${Math.min(progress, 100)}%`;
                    // --- THIS IS THE CHANGE ---
                    // Hide the bar (and cap) if progress is 0
                    progressBarFill.style.opacity = progress > 0 ? '1' : '0';
                    progressPercentageSpan.textContent = `${progress}%`;
                 }
             } catch (error) { console.error("Error fetching data for daily progress UI:", error); }
        }
		
		
		
async function updateWeeklyProgressUI(monthId, weekId, weekData = null) {
             if (!currentUser || !userId) return;
             const weekSection = document.querySelector(`[data-month-id="${monthId}"] .week-section[data-week-id="${weekId}"]`);
             if (!weekSection) return;
             const progressBarFill = weekSection.querySelector('.progress-bar-fill');
             const progressPercentageSpan = weekSection.querySelector('.progress-percentage');

             try {
                 let dataToUse = weekData;
                 if (!dataToUse) {
                     console.log("Progress UI fetching data for week...");
                     // --- START: MODIFIED ---
                     // Fetch from the correct subcollection path
                     const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId); 
                     const weekDocSnap = await getDoc(weekDocRef);
                     if (weekDocSnap.exists()) {
                         dataToUse = weekDocSnap.data(); // This is the weekData { days: [...] }
                     }
                     // --- END: MODIFIED ---
                 }

                 if (dataToUse) {
                    const progress = calculateWeeklyProgress(dataToUse);
                    progressBarFill.style.width = `${progress}%`;
                    progressBarFill.style.opacity = progress > 0 ? '1' : '0';
                    progressPercentageSpan.textContent = `${progress}%`;
                 }
             } catch (error) { console.error("Error fetching data for progress UI:", error); }
        }
		
        function showVocabMeaning(vocabWordElement) {
             document.querySelectorAll('.vocab-word.active').forEach(v => { if (v !== vocabWordElement) v.classList.remove('active'); });
             vocabWordElement.classList.toggle('active');
        }
        window.closeModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            // --- CHECK BOTH MODALS FOR FULLSCREEN EXIT ---
            if ((modalId === 'mcq-study-modal' || modalId === 'view-mcq-modal') && document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                else if (document.msExitFullscreen) document.msExitFullscreen();
            }
            
            modal.style.display = "none"; 

            // --- EXISTING QUIZ RESET LOGIC ---
            if (modalId === 'quiz-modal') {
                const resultsScreen = document.getElementById('quiz-results-screen');
                const reviewScreen = document.getElementById('quiz-review-screen');
                
                if (!resultsScreen.classList.contains('hidden') || !reviewScreen.classList.contains('hidden')) {
                    console.log("Resetting quiz modal state to start screen.");
                    resultsScreen.classList.add('hidden');
                    reviewScreen.classList.add('hidden');
                    document.getElementById('quiz-start-screen').classList.remove('hidden');
                    currentQuizQuestions = [];
                    currentVocabData = null;
                    currentMcqData = null;
                }
            }
        }
		window.onclick = function(event) {
             if (event.target.classList.contains('modal')) {
                
                if (event.target.id === 'quiz-modal') {
                    // এটি কুইজ মোডাল, বিশেষ ফাংশনটি কল করুন
                    closeQuizModal();
                
                } else if (event.target.id === 'delete-month-confirm-modal') {
                    // --- START: NEW LOGIC ---
                    // এটি ডিলিট মোডাল। এটি বন্ধ করবেন না। একে ঝাঁকুনি দিন!
                    const modalContent = event.target.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.add('modal-shake');
                    }
                    // --- END: NEW LOGIC ---
                
                } else {
                    // এটি অন্য কোনো সাধারণ মোডাল, এটি বন্ধ করুন
                    event.target.style.display = "none";
                }
             }
             if (!event.target.closest('.vocab-word')) { document.querySelectorAll('.vocab-word.active').forEach(v => v.classList.remove('active')); }
         }
        function parsePercentage(value) {
            if (value === null || value === undefined) return null; 
            let strVal = String(value).trim(); 
            if (strVal === '') return null;

            // Remove % sign if user typed it
            strVal = strVal.replace('%', '');
            
            // Replace comma with dot for decimals (e.g. 20,5 -> 20.5)
            strVal = strVal.replace(',', '.'); 
            
            const floatVal = parseFloat(strVal);
            
            if (!isNaN(floatVal)) { 
                // DIRECT: Input "20" -> Save "20"
                return parseFloat(floatVal.toFixed(2));
            } 
            
            return null; 
         }
		 
         function setSyncStatus(text, color) {
             if (!syncStatusText) return; syncStatusText.textContent = text;
             syncStatusText.classList.remove('text-emerald-500', 'text-yellow-500', 'text-red-500', 'text-blue-500');
             if (color === 'green') syncStatusText.classList.add('text-emerald-500');
             else if (color === 'yellow') syncStatusText.classList.add('text-yellow-500');
             else if (color === 'red') syncStatusText.classList.add('text-red-500');
             else if (color === 'blue') syncStatusText.classList.add('text-blue-500');
         }
         function showCustomAlert(message, type = "error") {
             console.log(`ALERT (${type}): ${message}`);
             const alertBox = document.createElement('div');
             alertBox.style.cssText = `position:fixed; top:80px; left:50%; transform:translateX(-50%); padding:12px 24px; border-radius:8px; z-index:200; box-shadow:0 4px 12px rgba(0,0,0,0.15); font-size: 0.9rem; font-weight: 500;`;
             if (type === 'success') { alertBox.style.backgroundColor = '#10b981'; alertBox.style.color = 'white'; }
             else { alertBox.style.backgroundColor = '#ef4444'; alertBox.style.color = 'white'; }
             alertBox.textContent = message; document.body.appendChild(alertBox);
             setTimeout(() => { alertBox.remove(); }, 3000);
         }
		
		function syncTextareaHeights(groupElement) {
            if (!groupElement) return;

            const textareas = groupElement.querySelectorAll('.target-textarea');
            if (textareas.length === 0) return;

            // 1. Reset all heights to auto to get the new natural scrollHeight
            textareas.forEach(ta => {
                ta.style.height = 'auto';
            });

            // 2. Find the maximum scrollHeight from the group
            let maxHeight = 0;
            textareas.forEach(ta => {
                maxHeight = Math.max(maxHeight, ta.scrollHeight);
            });
            
            // 3. Apply the new max height to all textareas in the group
            textareas.forEach(ta => {
                // Use a 60px min-height as a fallback
                ta.style.height = (maxHeight > 60 ? maxHeight : 60) + 'px'; 
            });
         }
		
		
		
		
        // --- START: REFACTORED QUIZ FUNCTIONS ---

        /**
         * Shuffles array in place using Fisher-Yates shuffle.
         */
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }


		
        
        /**
         * Generates a set of MCQ questions as objects to store answers.
         */
        /**
         * NEW: Parses vocab data to separate Bangla meanings and synonyms.
         * Input: [{word: "Albeit", meaning: "যদিও-Although"}]
         * Output: [{word: "Albeit", banglaMeaning: "যদিও", synonym: "Although"}]
         */
        function preProcessVocab(vocabData) {
            return vocabData.map(item => {
                const word = item.word?.trim();
                const meaningStr = item.meaning?.trim() || '';
                
                let banglaMeaning = meaningStr;
                let synonym = null;

                // Check for a hyphen that is not at the very beginning or end
                const hyphenIndex = meaningStr.indexOf('-');
                if (hyphenIndex > 0 && hyphenIndex < meaningStr.length - 1) {
                    banglaMeaning = meaningStr.substring(0, hyphenIndex).trim();
                    synonym = meaningStr.substring(hyphenIndex + 1).trim();
                }
                
                return {
                    word: word,
                    banglaMeaning: banglaMeaning,
                    synonym: synonym
                };
            });
        }

        /**
         * UPGRADED: Generates 3 types of questions from a specific list,
         * using a global pool for incorrect options.
         * @param {Array} questionList - The pre-processed vocab list to generate *questions* from.
         * @param {Object} optionPool - An object { allWords, allBanglaMeanings, allSynonyms } for *options*.
         */
        function generateQuizData(questionList, optionPool) {
            let questions = [];
            
            // --- 1. Get helper arrays from the provided option pool ---
            const { allWords, allBanglaMeanings, allSynonyms } = optionPool;

            // --- 2. Type 1: Synonym questions (Eng -> Syn) ---
            for (const item of questionList) {
                const { word, synonym } = item;

                if (synonym) {
                    // Wrong options come from the global pool
                    let wrongOptions = allSynonyms.filter(s => s !== synonym && s !== word);
                    if (wrongOptions.length < 3) {
                        wrongOptions.push(...allWords.filter(w => w !== word && w !== synonym));
                    }
                    
                    let options = shuffleArray([...new Set(wrongOptions)]).slice(0, 3);
                    options.push(synonym); // Add correct answer

                    questions.push({
                        question: `What is the synonym of "${word}"?`,
                        options: shuffleArray(options),
                        correctAnswer: synonym,
                        userAnswer: null,
                        isCorrect: null
                    });
                }
            }

            // --- 3. Type 2 & 3: Split the *question list* ---
            let shuffledList = shuffleArray([...questionList]);
            const n = shuffledList.length;
            const halfN = Math.ceil(n / 2);

            const engToBanList = shuffledList.slice(0, halfN);
            const banToEngList = shuffledList.slice(halfN);

            // --- 4. Type 2: Eng -> Ban questions ---
            for (const item of engToBanList) {
                const { word, banglaMeaning } = item;
                
                // Wrong options come from the global pool
                let wrongMeanings = allBanglaMeanings.filter(m => m !== banglaMeaning);
                let options = shuffleArray([...new Set(wrongMeanings)]).slice(0, 3);
                options.push(banglaMeaning); // Add correct answer
                
                questions.push({
                    question: `What is the meaning of "${word}"?`,
                    options: shuffleArray(options),
                    correctAnswer: banglaMeaning,
                    userAnswer: null,
                    isCorrect: null
                });
            }

            // --- 5. Type 3: Ban -> Eng questions ---
            for (const item of banToEngList) {
                const { word, banglaMeaning } = item;
                
                // Wrong options come from the global pool
                let wrongWords = allWords.filter(w => w !== word);
                let options = shuffleArray([...new Set(wrongWords)]).slice(0, 3);
                options.push(word); // Add correct answer
                
                questions.push({
                    question: `What is the English word for "${banglaMeaning}"?`,
                    options: shuffleArray(options),
                    correctAnswer: word,
                    userAnswer: null,
                    isCorrect: null
                });
            }

            // --- 6. Final shuffle ---
            return shuffleArray(questions);
        }

        
		// --- HELPER: Conditional Option Shuffling (UPDATED) ---
        function getProcessedOptions(originalOptions) {
            // Words that prevent shuffling if present in ANY option
            const restrictedPhrases = [
                // English
                "Both", "All of the above", "None of the above", "a & b", "b and c", "c and d", "none", "all", "All",
                // Bengali - Both/All
                "উভয়", "উভয়ই", "দুটিই", "উপরের সব", "উপরের সবগুলো", "সবগুলো",
                // Bengali - None
                "কোনোটিই নয়", "কোনোটিই না", "কোনোটি নয়", "কোনোটি না",
                // Bengali - Combinations (e.g., "K and Kh")
                "ক ও খ", "খ ও গ", "ক ও গ", "ক ও গ"
            ];
            
            // Check if ANY option contains a restricted phrase
            const shouldShuffle = !originalOptions.some(opt => 
                restrictedPhrases.some(phrase => opt.toLowerCase().includes(phrase.toLowerCase()))
            );
            
            // Create a copy of options
            const newOptions = [...originalOptions];
            
            // Shuffle only if safe, otherwise keep original order
            return shouldShuffle ? shuffleArray(newOptions) : newOptions;
        }
		
		/**
         * Resets state and starts the quiz game.
         */
        function runQuizGame() {
            // 1. Hide Start Screen
            quizStartScreen.classList.add('hidden');
            quizStartScreen.style.display = 'none'; 
            
            // 2. Hide Results & Review Screens
            quizResultsScreen.classList.add('hidden');
            quizResultsScreen.style.display = 'none';
            
            quizReviewScreen.classList.add('hidden');
            quizReviewScreen.style.display = 'none';

            // 3. SHOW Main Screen
            quizMainScreen.classList.remove('hidden');
            quizMainScreen.style.display = ''; 

            // --- RE-GENERATION LOGIC ---
            if (currentVocabData) {
                if (!currentOptionPool) {
                    console.warn("No option pool found. Falling back.");
                    currentOptionPool = {
                        allWords: currentVocabData.map(v => v.word),
                        allBanglaMeanings: currentVocabData.map(v => v.banglaMeaning),
                        allSynonyms: currentVocabData.map(v => v.synonym).filter(Boolean)
                    };
                }
                currentQuizQuestions = generateQuizData(currentVocabData, currentOptionPool);
            } else if (currentMcqData) {
                currentQuizQuestions = shuffleArray(currentMcqData.map(mcq => ({ 
                    question: mcq.question,
                    options: getProcessedOptions(mcq.options), 
                    correctAnswer: mcq.correctAnswer,
                    explanation: mcq.explanation || null,
					note: mcq.note || null,
                    userAnswer: null, 
                    isCorrect: null 
                }))); 
            } else {
                console.warn("No source data found, re-shuffling.");
                currentQuizQuestions = shuffleArray(currentQuizQuestions);
            }

            currentQuizQuestionIndex = 0;
            currentQuizScore = 0;

            quizScoreEl.textContent = `Score: 0.00`;
            quizRestartBtn.onclick = runQuizGame;
            
            const totalQuestions = currentQuizQuestions.length;
            
            // --- NEW TIMING LOGIC ---
            // If MCQ Data exists, use 20 seconds. Otherwise (Vocab), use 15 seconds.
            const secondsPerQuestion = currentMcqData ? 40 : 15;
            const totalTimeInSeconds = totalQuestions * secondsPerQuestion;
            // ------------------------

            startTimer(totalTimeInSeconds); 
            
            loadQuizQuestion();
            
            quizQuestionArea.classList.remove('slide-in-right', 'slide-in-left');
        }
		
		
		function startTimer(totalSeconds) {
            if (quizTimerInterval) clearInterval(quizTimerInterval); // Clear any old timer
            quizStartTime = Date.now(); // <-- এই লাইনটি কুইজ শুরুর সময় সেভ করবে

            quizTotalSeconds = totalSeconds; 
            quizRemainingSeconds = totalSeconds; 
            let remaining = totalSeconds;
            
            const timerEl = document.getElementById('quiz-timer');
            
            timerEl.textContent = formatTime(remaining); // Show initial time
            timerEl.style.color = '#374151'; // Reset to default color (gray-700)

            quizTimerInterval = setInterval(() => {
                remaining--;
                quizRemainingSeconds = remaining; // <-- ADDED: Update global remaining time
                timerEl.textContent = formatTime(remaining);
                
                // Make timer red in the last 10 seconds
                if (remaining <= 10 && remaining > 0) {
                    timerEl.style.color = '#ef4444'; // red-500
                }
                
                // TIME'S UP!
                if (remaining <= 0) {
                    clearInterval(quizTimerInterval);
                    timerEl.textContent = "Time's Up!";
                    showCustomAlert("Time's up! Showing your results.", "error");
                    showQuizResults(); // Auto-submit the quiz
                }
            }, 1000);
        }
		
        
        /**
         * Displays the current question and options. (UPDATED: Persists Explanation)
         */
        function loadQuizQuestion() {
            quizOptionsContainer.innerHTML = '';
            
            // 1. Remove any existing note from previous render
            const oldNote = document.getElementById('quiz-instant-note');
            if (oldNote) oldNote.remove();
            
            const q = currentQuizQuestions[currentQuizQuestionIndex];
            
            quizQuestionNumber.textContent = `Question ${currentQuizQuestionIndex + 1}/${currentQuizQuestions.length}`;
            quizQuestionText.textContent = q.question;

            // --- Button State Logic ---
            quizNextBtn.disabled = (q.userAnswer === null);
            quizSkipBtn.hidden = (q.userAnswer !== null);
            quizPrevBtn.hidden = (currentQuizQuestionIndex === 0);

            // --- OPTIMIZED RENDERING ---
            const fragment = new DocumentFragment();

            q.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.className = "quiz-option-btn";
                
                if (banglaRegex.test(option)) {
                    button.classList.add('quiz-option-bangla');
                }

                if (q.userAnswer !== null) {
                    // Question answered: Lock buttons & Show colors
                    button.disabled = true;
                    if (option === q.correctAnswer) {
                        button.classList.add('correct');
                    } else if (option === q.userAnswer) {
                        button.classList.add('incorrect');
                    }
                } else {
                    // New question: Add click listener
                    button.onclick = () => selectQuizAnswer(button, option);
                }
                fragment.appendChild(button);
            });

            quizOptionsContainer.appendChild(fragment);

            // --- FIX: RE-RENDER NOTE IF ALREADY ANSWERED ---
            if (q.userAnswer !== null && q.note) {
                const noteDiv = document.createElement('div');
                noteDiv.id = 'quiz-instant-note';
                noteDiv.className = 'mt-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-sm explanation-text';
                noteDiv.innerHTML = `<span class="font-bold"><i class="fas fa-info-circle mr-1"></i> Explanation:</span> ${escapeHtml(q.note)}`;
                
                // Insert after the options container
                quizOptionsContainer.parentNode.insertBefore(noteDiv, quizOptionsContainer.nextSibling);
            }
            // ----------------------------------------------
        }
		
       /**
         * Handles the user's answer selection. (UPDATED: Instant 100ms Advance)
         */
        function selectQuizAnswer(selectedButton, selectedOption) {
            const q = currentQuizQuestions[currentQuizQuestionIndex];
            
            // Do nothing if already answered
            if (q.userAnswer !== null) return;

            // Store the answer
            q.userAnswer = selectedOption;
            const isCorrect = (selectedOption === q.correctAnswer);
            q.isCorrect = isCorrect;
            
            // Apply scoring
            if (isCorrect) currentQuizScore += 1;
            else currentQuizScore -= 0.25;
            
            quizScoreEl.textContent = `Score: ${currentQuizScore.toFixed(2)}`;

            // Apply visual feedback to buttons
            Array.from(quizOptionsContainer.children).forEach(btn => {
                btn.disabled = true;
                if (btn.textContent === q.correctAnswer) {
                    btn.classList.add('correct');
                } else if (btn.textContent === selectedOption) {
                    btn.classList.add('incorrect');
                }
            });

            // --- SHOW NOTE IMMEDIATELY (CORRECT OR WRONG) ---
            if (q.note) {
                // Remove old note just in case
                const oldNote = document.getElementById('quiz-instant-note');
                if (oldNote) oldNote.remove();

                const noteDiv = document.createElement('div');
                noteDiv.id = 'quiz-instant-note';
                noteDiv.className = 'mt-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-sm animate-fade-in explanation-text';
                noteDiv.innerHTML = `<span class="font-bold"><i class="fas fa-info-circle mr-1"></i> Explanation:</span> ${escapeHtml(q.note)}`;
                
                quizOptionsContainer.parentNode.insertBefore(noteDiv, quizOptionsContainer.nextSibling);
            }
            // ---------------------------------------------------------
            
            // Enable "Next" button immediately so user can proceed manually
            quizNextBtn.disabled = false;
            quizSkipBtn.hidden = true;

            // Auto-advance Logic (INSTANT)
            if (isCorrect) {
                setTimeout(() => {
                    // Only auto-advance if it's NOT the last question
                    if (currentQuizQuestionIndex < currentQuizQuestions.length - 1) {
                        currentQuizQuestionIndex++;
                        loadQuizQuestion();
                        quizQuestionArea.classList.add('slide-in-right');
                    } else {
                        showQuizResults();
                    }
                }, 100); // <--- Changed to 100ms (Instant)
            }
        }
		
		
        function showQuizResults() {
			if (quizTimerInterval) clearInterval(quizTimerInterval);
            const quizEndTime = Date.now(); 
            
            // --- FIX FOR OVERLAPPING SCREENS ---
            const startScreen = document.getElementById('quiz-start-screen');
            const mainScreen = document.getElementById('quiz-main-screen');
            const resultsScreen = document.getElementById('quiz-results-screen');
            const reviewScreen = document.getElementById('quiz-review-screen');

            if (startScreen) {
                startScreen.classList.add('hidden');
                startScreen.style.setProperty('display', 'none', 'important'); 
            }
            if (mainScreen) {
                mainScreen.classList.add('hidden');
                mainScreen.style.display = 'none';
            }
            if (reviewScreen) {
                reviewScreen.classList.add('hidden');
                reviewScreen.style.display = 'none';
            }
            if (resultsScreen) {
                resultsScreen.classList.remove('hidden');
                resultsScreen.style.display = ''; 
            }
			
            // --- STATS CALCULATIONS ---
            const totalQuestions = currentQuizQuestions.length;
            let correctCount = 0;
            let wrongCount = 0;
            let notAnsweredCount = 0;

            currentQuizQuestions.forEach(q => {
                if (q.isCorrect === true) {
                    correctCount++;
                } else if (q.isCorrect === false) {
                    wrongCount++;
                } else {
                    notAnsweredCount++;
                }
            });

            const answeredCount = correctCount + wrongCount;
            const correctScore = correctCount * 1;
            const wrongScore = wrongCount * -0.25;
            const finalScore = correctScore + wrongScore;
            const percentage = (totalQuestions > 0) ? (Math.max(0, finalScore) / totalQuestions) * 100 : 0;
            const timeTakenInSeconds = Math.round((quizEndTime - quizStartTime) / 1000);
            
			// --- CAPTURE RESULT DATA ---
            const quizType = currentMcqData ? 'MCQ' : 'Vocab';
            
            const subjectInfo = window.currentQuizSubjectInfo || { subjectName: quizType, topicDetail: 'Quiz' };
            const { subjectName, topicDetail } = subjectInfo;

            let baseTopicName = ''; 
            let topicLink = null; 

            // --- BUG FIX: SAFE TOPIC NAME GENERATION ---
            try {
                if (currentMcqTarget) { 
                    const { quizType: mcqAggregatedType, monthId, weekId, dayIndex } = currentMcqTarget;
                    
                    if (mcqAggregatedType === 'day' || (dayIndex !== null && dayIndex !== undefined && weekId)) {
                        const dayEl = document.querySelector(`#day-${monthId}-${weekId}-${dayIndex} h4`);
                        const dayNum = dayEl ? dayEl.textContent : `Day ${parseInt(dayIndex) + 1}`;
                        // Added safe check for weekId
                        const wStr = weekId ? weekId.replace('week', 'W') : 'W?';
                        baseTopicName = `${dayNum}, ${wStr}, ${monthId}`;
                        topicLink = `#day-${monthId}-${weekId}-${dayIndex}`; 
                    } else if (mcqAggregatedType === 'week') {
                        baseTopicName = `${weekId.replace('week', 'Week ')}, ${monthId}`;
                        topicLink = `#mcq-quiz-center`; 
                    } else if (mcqAggregatedType === 'month') {
                        baseTopicName = `${monthId} (All)`;
                        topicLink = `#mcq-quiz-center`; 
                    } else {
                        // Fallback for Study Mode / Aggregated (where weekId might be undefined)
                        if (currentMcqTarget.description) {
                            baseTopicName = currentMcqTarget.description;
                        } else if (weekId) {
                            // It has a weekId, try to format it
                            const dayEl = document.querySelector(`#day-${monthId}-${weekId}-${dayIndex} h4`);
                            const dayNum = dayEl ? dayEl.textContent : `Day ${parseInt(dayIndex) + 1}`;
                            baseTopicName = `${dayNum}, ${weekId.replace('week', 'W')}, ${monthId}`;
                            topicLink = `#day-${monthId}-${weekId}-${dayIndex}`;
                        } else {
                            baseTopicName = "Custom Quiz";
                        }
                    }
                } else if (window.currentQuizSourceInfo) { 
                    const { monthId, weekId, dayIndex, rowIndex } = window.currentQuizSourceInfo;
                    
                    if (dayIndex !== undefined && rowIndex !== undefined) {
                        const dayEl = document.querySelector(`#day-${monthId}-${weekId}-${dayIndex} h4`);
                        const dayNum = dayEl ? dayEl.textContent : `Day ${parseInt(dayIndex) + 1}`;
                        const wStr = weekId ? weekId.replace('week', 'W') : 'W?';
                        baseTopicName = `${dayNum}, ${wStr}, ${monthId}`;
                        topicLink = `#day-${monthId}-${weekId}-${dayIndex}`;
                    } else if (weekId) { 
                        baseTopicName = `${weekId.replace('week', 'Week ')}, ${monthId}`;
                        topicLink = `#vocab-quiz-center`;
                    }
                }
            } catch (e) {
                console.warn("Error generating topic name, using fallback.", e);
                baseTopicName = "Unknown Topic";
            }
            
            const finalTopicName = `${subjectName} - ${baseTopicName}`; 
            
            // Create Deep Copy for Review
            const questionsSnapshot = JSON.parse(JSON.stringify(currentQuizQuestions));

            currentQuizResultData = {
                quizType: quizType,
                topicName: finalTopicName,
                subjectName: subjectName,
                topicDetail: topicDetail,
                topicLink: topicLink, 
                saveTimestamp: null, 
                correctCount: correctCount,
                wrongCount: wrongCount,
                notAnsweredCount: notAnsweredCount,
                answeredCount: answeredCount,
                correctScore: correctScore,
                wrongScore: wrongScore,
                finalScore: finalScore,
                totalQuestions: totalQuestions,
                percentage: parseFloat(percentage.toFixed(1)),
                timeTakenInSeconds: timeTakenInSeconds,
                questions: questionsSnapshot 
            };
            
            if(saveBtn) {
                if (isGuestMode) {
                    saveBtn.style.display = 'none'; 
                } else {
                    saveBtn.style.display = 'inline-flex'; 
                    saveBtn.disabled = false; 
                    saveBtn.innerHTML = `<i class="fas fa-save mr-2"></i>Save`;
                }
            }
			
            // --- UPDATE UI TEXT ---
            document.getElementById('summary-answered-count').textContent = answeredCount;
            document.getElementById('summary-correct-count').textContent = correctCount;
            document.getElementById('summary-correct-score').textContent = `+${correctScore.toFixed(2)}`;
            document.getElementById('summary-wrong-count').textContent = wrongCount;
            document.getElementById('summary-wrong-score').textContent = wrongScore.toFixed(2);
            document.getElementById('summary-not-answered-count').textContent = notAnsweredCount;
            document.getElementById('summary-not-answered-score').textContent = `0.00`;
            document.getElementById('summary-final-score').textContent = finalScore.toFixed(2);
            document.getElementById('summary-percentage').textContent = `${percentage.toFixed(1)}%`;
            document.getElementById('summary-time-taken').textContent = formatTime(timeTakenInSeconds);
            
            if (wrongCount > 0) {
                quizReviewBtn.style.display = 'inline-flex';
            } else {
                quizReviewBtn.style.display = 'none';
            }
        }
		
		
        // --- START: ADD NEW QUIZ NAV LISTENERS ---
        quizNextBtn.addEventListener('click', () => {
            currentQuizQuestionIndex++;
            if (currentQuizQuestionIndex >= currentQuizQuestions.length) {
                showQuizResults();
            } else {
                loadQuizQuestion();
                quizQuestionArea.classList.add('slide-in-right'); // <-- ADD THIS
            }
        });

        quizSkipBtn.addEventListener('click', () => {
            // "Skip" just acts like "Next" but guarantees no answer is saved
            currentQuizQuestionIndex++;
            if (currentQuizQuestionIndex >= currentQuizQuestions.length) {
                showQuizResults();
            } else {
                loadQuizQuestion();
                quizQuestionArea.classList.add('slide-in-right'); // <-- ADD THIS
            }
        });

        quizPrevBtn.addEventListener('click', () => {
            if (currentQuizQuestionIndex > 0) {
                currentQuizQuestionIndex--;
                loadQuizQuestion();
                quizQuestionArea.classList.add('slide-in-left'); // <-- ADD THIS
            }
        });
        // --- END: ADD NEW QUIZ NAV LISTENERS ---

        // --- START: NEW REVIEW SCREEN LOGIC ---
        
        // 1. Button on Results Page: "Review Wrong"
        quizReviewBtn.addEventListener('click', () => {
            showReviewScreen();
        });
        
        // 2. Button on Review Page: "Back to Results"
        quizBackToResultsBtn.addEventListener('click', () => {
            const resultsScreen = document.getElementById('quiz-results-screen');
            const reviewScreen = document.getElementById('quiz-review-screen');

            // 1. Hide Review Screen (Forcefully)
            reviewScreen.classList.add('hidden');
            reviewScreen.style.display = 'none';

            // 2. Show Results Screen (Clear the inline 'display: none')
            resultsScreen.classList.remove('hidden');
            resultsScreen.style.display = ''; 
        });
        
        function showReviewScreen() {
            // ... (keep the force hide/show logic at the top) ...
            const resultsScreen = document.getElementById('quiz-results-screen');
            const reviewScreen = document.getElementById('quiz-review-screen');
            resultsScreen.classList.add('hidden'); resultsScreen.style.display = 'none';
            reviewScreen.classList.remove('hidden'); reviewScreen.style.display = '';

            quizReviewContent.innerHTML = '';
            
            const wrongAnswers = currentQuizQuestions.filter(q => q.isCorrect === false);
            
            if (wrongAnswers.length === 0) {
                quizReviewContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">You got all questions correct!</p>';
                return;
            }
            
            let html = '';
            wrongAnswers.forEach(q => {
                let feedbackHtml = '';
                
                if (q.correctAnswer) {
                    // Standard Logic
                    feedbackHtml = `
                    <div class="review-options">
                        ${q.options.map(option => {
                            let className = 'review-option';
                            if (option === q.correctAnswer) className += ' correct';
                            else if (option === q.userAnswer) className += ' incorrect';
                            return `<div class="${className}">${escapeHtml(option)}</div>`;
                        }).join('')}
                    </div>`;
                } else {
                    // Cancelled/No Answer Logic
                    feedbackHtml = `
                    <div class="review-options">
                        ${q.options.map(option => {
                            let className = 'review-option';
                            if (option === q.userAnswer) className += ' incorrect'; // Mark user choice wrong
                            return `<div class="${className}">${escapeHtml(option)}</div>`;
                        }).join('')}
                    </div>
                    <div class="mt-2 text-sm text-amber-600 font-semibold p-2 bg-amber-50 rounded border border-amber-200">
                        <i class="fas fa-info-circle mr-1"></i> Note: ${escapeHtml(q.explanation || 'No correct answer defined')}
                    </div>`;
                }

                // --- NEW: ADD NOTE TO REVIEW ---
                let reviewNoteHtml = '';
                if (q.note) {
                    reviewNoteHtml = `<div class="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded"><i class="fas fa-info-circle mr-1"></i> ${escapeHtml(q.note)}</div>`;
                }
                // -------------------------------

                html += `
                <div class="review-item">
                    <p class="review-question">${escapeHtml(q.question)}</p>
                    ${feedbackHtml}
                    ${reviewNoteHtml}
                </div>`;
            });
            
            quizReviewContent.innerHTML = html;
        }
		
        // --- END: NEW REVIEW SCREEN LOGIC ---
		
		// --- START: ADD THIS NEW FUNCTION ---
        /**
         * Shows the new 3-button quiz confirmation modal
         */
        function showQuizConfirmationModal() {
            const modal = document.getElementById('quiz-confirm-modal');
            const quitBtn = document.getElementById('quiz-confirm-quit');
            const submitBtn = document.getElementById('quiz-confirm-submit');
            const continueBtn = document.getElementById('quiz-confirm-continue');

            modal.style.display = 'block';

            // 1. "Quit" Button (Gray)
            // Quits the quiz, closes both modals
            quitBtn.onclick = () => {
				if (quizTimerInterval) clearInterval(quizTimerInterval);
                modal.style.display = 'none';
                closeModal('quiz-modal'); // Close the main quiz modal
            };

            // 2. "Submit Test" Button (Green)
            // Quits the quiz, closes both modals, and shows results
            submitBtn.onclick = () => {
                modal.style.display = 'none';
                
                showQuizResults(); // Jump straight to the results page
            };

            // 3. "Continue" Button (Blue)
            // Closes only the warning modal, resumes the quiz
            continueBtn.onclick = () => {
                modal.style.display = 'none'; // Just close this warning
            };
        }
        // --- END: ADD THIS NEW FUNCTION ---
		
		
        /**
         * Checks if a quiz is in progress OR review is active before closing the modal.
         */
        window.closeQuizModal = function() {
            const mainScreen = document.getElementById('quiz-main-screen');
            const reviewScreen = document.getElementById('quiz-review-screen'); // <-- NEW: Get review screen
            
            const isQuizInProgress = !mainScreen.classList.contains('hidden');
            const isReviewing = !reviewScreen.classList.contains('hidden'); // <-- NEW: Check if visible

            if (isQuizInProgress) {
                // Case 1: Quiz is in progress. Show 3-button "Yes/No/Submit" modal.
                showQuizConfirmationModal();
                
            } else if (isReviewing) {
                // --- START: NEW LOGIC ---
                // Case 2: Review screen is visible. Show a simple "Yes/No" modal.
                // We re-use the generic confirmation modal for this.
                showConfirmationModal(
                    "Close Review",
                    "Are you sure you want to close the quiz? You can review your answers again from the results page.",
                    () => {
                        // This is the 'onConfirm' action (user clicks "Confirm")
                        closeModal('quiz-modal'); // This is the *real* close function
                    }
                );
                // --- END: NEW LOGIC ---
                
            } else {
                // Case 3: On Start or Results screen. Close without warning.
                closeModal('quiz-modal');
            }
        }

        // --- START: NEW QUIZ CENTER LOGIC ---

        const quizCenterModal = document.getElementById('quiz-center-modal');
        const quizCenterContent = document.getElementById('quiz-center-content');

        // 1. Add listener to the "Test Yourself" button
        document.getElementById('show-quiz-center-btn').addEventListener('click', () => {
            openQuizCenter();
        });

        // 2. Function to open and populate the Quiz Center
        async function openQuizCenter() {
            quizCenterModal.style.display = "block";
            quizCenterContent.innerHTML = '<p class="text-center text-gray-500 italic py-5">Loading available quizzes...</p>';
            
            try {
                const plansCollectionPath = getUserPlansCollectionPath();
                const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
                const querySnapshot = await getDocs(q); // Gets all MONTHS
                
                let quizButtonsHtml = '';
                let quizzesFound = 0;

                for (const docSnap of querySnapshot.docs) { // Loop 1: Months
                    const monthId = docSnap.id;
                    const monthData = docSnap.data();
                    const monthName = monthData.monthName || monthId;

                    // --- START: MODIFIED ---
                    // Fetch the weeks subcollection for this month
                    const weeksCollectionRef = collection(db, docSnap.ref.path, 'weeks');
                    const weeksQuerySnapshot = await getDocs(weeksCollectionRef); // Gets all WEEKS
                    // --- END: MODIFIED ---

                    for (const weekDocSnap of weeksQuerySnapshot.docs) { // Loop 2: Actual weeks
                        const weekId = weekDocSnap.id;
                        const weekData = weekDocSnap.data(); // This is { days: [...] }

                        if (!weekData || !weekData.days) continue;

                        // Aggregate all vocab from this week
                        let weekVocab = [];
                        for (const day of weekData.days) {
                            for (const row of day.rows) {
                                if (row.subject?.toLowerCase() === 'vocabulary' && row.vocabData) {
                                    weekVocab.push(...row.vocabData);
                                }
                            }
                        }

                        // Only create a button if there are enough words
                        if (weekVocab.length >= 4) {
                            quizzesFound++;
                            const weekTitle = weekId.replace('week', 'Week ');
                            quizButtonsHtml += `<button class="quiz-week-btn" data-month-id="${monthId}" data-week-id="${weekId}">
                                ${weekTitle} - ${monthName} (${weekVocab.length} words)
                            </button>`;
                        }
                    }
                }

                if (quizzesFound === 0) {
                    quizCenterContent.innerHTML = '<p class="text-center text-gray-500 italic py-5">No weekly quizzes available. Add at least 4 vocab words to any week to start.</p>';
                } else {
                    quizCenterContent.innerHTML = quizButtonsHtml;
                }

            } catch (error) {
                console.error("Error loading quizzes:", error);
                quizCenterContent.innerHTML = '<p class="text-center text-red-500 py-5">Could not load quizzes. Please try again.</p>';
            }
        }
		
		// 4. Function to start a week-long quiz (FIXED OVERLAP)
        async function startWeekQuiz(monthId, weekId) {
            quizTitle.textContent = 'Vocabulary Quiz';
            window.currentQuizSourceInfo = { monthId, weekId };
			window.currentQuizSubjectInfo = { subjectName: "Vocabulary", topicDetail: "Weekly Vocabulary" };
            closeModal('quiz-center-modal');
			
            // --- START: FIX FOR OVERLAPPING SCREENS ---
            quizModal.style.display = "block";
            
            // Force hide Main, Results, and Review screens
            quizMainScreen.classList.add('hidden');
            quizMainScreen.style.display = 'none';
            
            quizResultsScreen.classList.add('hidden');
            quizResultsScreen.style.display = 'none'; // This prevents the result window from showing
            
            quizReviewScreen.classList.add('hidden');
            quizReviewScreen.style.display = 'none';

            // Show Start Screen
            quizStartScreen.classList.remove('hidden');
            quizStartScreen.style.display = '';
            // --- END: FIX FOR OVERLAPPING SCREENS ---
            
            quizStartMessage.textContent = "Loading week's vocabulary...";
            quizStartBtn.classList.add('hidden');
            document.getElementById('quiz-total-time-warning').style.display = 'none';

            try {
                // --- START: MODIFIED ---
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);
                if (!weekDocSnap.exists()) throw new Error("Week document not found.");

                const weekData = weekDocSnap.data();
                // --- END: MODIFIED ---
                
                if (!weekData || !weekData.days) throw new Error("Week data not found.");
                
                let allWeekVocab = [];
                for (const day of weekData.days) {
                    for (const row of day.rows) {
                        if (row.subject?.toLowerCase() === 'vocabulary' && row.vocabData) {
                            allWeekVocab.push(...row.vocabData);
                        }
                    }
                }
                if (allWeekVocab.length < 4) {
                    quizStartMessage.textContent = "You need at least 4 vocabulary words to start a quiz.";
                    return;
                }

                const questionList = preProcessVocab(allWeekVocab);
                currentVocabData = questionList; 
                currentMcqData = null;

                quizStartMessage.textContent = "Loading global vocabulary pool...";
                let optionPool = await getGlobalVocabPool(monthId, weekId, null);

                if (optionPool.allWords.length < 4) {
                    console.warn("No previous vocab found. Using current week's vocab as option pool.");
                    optionPool = {
                        allWords: questionList.map(v => v.word),
                        allBanglaMeanings: questionList.map(v => v.banglaMeaning),
                        allSynonyms: questionList.map(v => v.synonym).filter(Boolean)
                    };
                } else {
                    questionList.forEach(v => {
                        if(v.word) optionPool.allWords.push(v.word);
                        if(v.banglaMeaning) optionPool.allBanglaMeanings.push(v.banglaMeaning);
                        if (v.synonym) optionPool.allSynonyms.push(v.synonym);
                    });
                }
                
                currentOptionPool = optionPool; 
                currentQuizQuestions = []; 
                
                const totalQuestions = questionList.length + questionList.filter(v => v.synonym).length;
                const totalTimeInSeconds = totalQuestions * 15;
                
                const warningP = document.getElementById('quiz-total-time-warning');
                warningP.querySelector('span').textContent = formatTime(totalTimeInSeconds);
                warningP.style.display = 'block';

                quizStartMessage.textContent = `Ready to test yourself on ${allWeekVocab.length} words from this week?`;
                quizStartBtn.classList.remove('hidden');
                
                const newStartBtn = quizStartBtn.cloneNode(true);
                quizStartBtn.parentNode.replaceChild(newStartBtn, quizStartBtn);
                newStartBtn.addEventListener('click', runQuizGame);
                quizStartBtn = newStartBtn; 
                
            } catch (error) {
                console.error("Error loading week quiz data:", error);
                quizStartMessage.textContent = "Could not load week quiz data. Please try again.";
            }
        }
		
		
        // 3. Add a global click listener for the new week buttons
        quizCenterContent.addEventListener('click', (e) => {
            const button = e.target.closest('.quiz-week-btn');
            if (button) {
                const { monthId, weekId } = button.dataset;
                startWeekQuiz(monthId, weekId);
            }
        });

        // 4. Function to start a week-long quiz
        // UPGRADED: Generates questions first to set timer
        

        // --- END: NEW QUIZ CENTER LOGIC ---
		
		// --- START: NEW MCQ FEATURE LOGIC ---

        const addMcqModal = document.getElementById('add-mcq-modal');
        const saveMcqBtn = document.getElementById('save-mcq-btn');
        const mcqPasteTextarea = document.getElementById('mcq-paste-textarea');
        const viewMcqModal = document.getElementById('view-mcq-modal');
        const viewMcqContent = document.getElementById('view-mcq-content');

       // 1. "Add/Edit MCQ" Button Handler (UPDATED: Shows Notes in Edit Mode)
        async function openAddMcqModal(monthId, weekId, dayIndex, rowIndex) {
            currentMcqTarget = { monthId, weekId, dayIndex, rowIndex };
            mcqPasteTextarea.value = ''; 
            
            const deleteBtn = document.getElementById('delete-all-mcqs-btn');
            deleteBtn.classList.add('hidden'); // Hide by default

            // Find the button in the DOM to check for data
            const daySection = document.querySelector(`[data-month-id="${monthId}"] [data-week-id="${weekId}"] [data-day-index="${dayIndex}"]`);
            const row = daySection ? daySection.querySelector(`tr[data-row-index="${rowIndex}"]`) : null;
            const button = row ? row.querySelector('.add-row-mcq-btn') : null;

            let hasData = false;

            // A. Check for LOCAL temporary data
            if (button && button.dataset.tempMcq) {
                const localData = JSON.parse(button.dataset.tempMcq);
                const rawText = localData.map((mcq, index) => {
                    const options = mcq.options.map((opt, i) => `${['a', 'b', 'c', 'd'][i]}. ${opt}`).join('\n');
                    
                    let answerLine = "";
                    if (mcq.correctAnswer) {
                        const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
                        const correctPrefix = correctIndex !== -1 ? ['a', 'b', 'c', 'd'][correctIndex] : '??';
                        answerLine = `Correct answer: ${correctPrefix}. ${mcq.correctAnswer}`;
                    } else {
                        answerLine = `Correct answer: ${mcq.explanation || 'Cancelled'}`;
                    }

                    // --- FIX: Append Note if exists ---
                    if (mcq.note) {
                        answerLine += `\nNote: ${mcq.note}`;
                    }
                    // ---------------------------------

                    return `${index + 1}. ${mcq.question}\n${options}\n${answerLine}\n`;
                }).join('\n');
                
                mcqPasteTextarea.value = rawText;
                hasData = true;
            }
            // B. Check DATABASE if no local data
            else {
                setSyncStatus("Loading...", "blue");
                try {
                    const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                    const weekDocSnap = await getDoc(weekDocRef);
                    
                    if (weekDocSnap.exists()) {
                        const mcqData = weekDocSnap.data().days?.[dayIndex]?.rows?.[rowIndex]?.mcqData;
                        
                        if (mcqData && mcqData.length > 0) {
                            const rawText = mcqData.map((mcq, index) => {
                                const options = mcq.options.map((opt, i) => `${['a', 'b', 'c', 'd'][i]}. ${opt}`).join('\n');
                                
                                let answerLine = "";
                                if (mcq.correctAnswer) {
                                    const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
                                    const correctPrefix = correctIndex !== -1 ? ['a', 'b', 'c', 'd'][correctIndex] : '??';
                                    answerLine = `Correct answer: ${correctPrefix}. ${mcq.correctAnswer}`;
                                } else {
                                    answerLine = `Correct answer: ${mcq.explanation || 'Cancelled'}`;
                                }

                                // --- FIX: Append Note if exists ---
                                if (mcq.note) {
                                    answerLine += `\nNote: ${mcq.note}`;
                                }
                                // ---------------------------------

                                return `${index + 1}. ${mcq.question}\n${options}\n${answerLine}\n`;
                            }).join('\n');
                            
                            mcqPasteTextarea.value = rawText;
                            hasData = true;
                        }
                    }
                    setSyncStatus("Synced", "green");
                } catch (error) {
                    console.error("Error fetching MCQ data:", error);
                    setSyncStatus("Error", "red");
                }
            }

            if (hasData) {
                deleteBtn.classList.remove('hidden');
            }

            addMcqModal.style.display = 'block';
        }
		
        // 2. Modal "Parse & Save" Handler (UPDATED: With Validation)
        saveMcqBtn.addEventListener('click', () => { 
            if (!currentMcqTarget) return;

            const { monthId, weekId, dayIndex, rowIndex } = currentMcqTarget;
            const rawText = mcqPasteTextarea.value;
            const parsedData = parseMcqText(rawText);

            // --- FIX: VALIDATION CHECK ---
            if (parsedData.length === 0) {
                showCustomAlert("No MCQs found! Please check the format and try again.", "error");
                return; // Stop here, do NOT close the modal
            }
            // -----------------------------

            closeModal('add-mcq-modal');
            
            // Find the button in the UI
            const daySection = document.querySelector(`[data-month-id="${monthId}"] [data-week-id="${weekId}"] [data-day-index="${dayIndex}"]`);
            const row = daySection ? daySection.querySelector(`tr[data-row-index="${rowIndex}"]`) : null;
            const button = row ? row.querySelector('.add-row-mcq-btn') : null;

            if (button) {
                if (parsedData.length > 0) {
                    // 1. Save data to the DOM element temporarily
                    button.dataset.tempMcq = JSON.stringify(parsedData);
                    // 2. Update UI visually
                    button.innerHTML = `<i class="fas fa-pencil-alt mr-1"></i> Edit Qs (${parsedData.length})`;
                    button.classList.add('bg-emerald-100', 'text-emerald-700'); 
                    showCustomAlert(`${parsedData.length} MCQs attached to row! (Click 'Save Day' to confirm)`, "success");
                } else {
                    // This block is now unreachable due to the check above, but kept for safety
                    delete button.dataset.tempMcq;
                    button.innerHTML = `<i class="fas fa-plus mr-1"></i> Add Qs`;
                    button.classList.remove('bg-emerald-100', 'text-emerald-700');
                }
                
                // Trigger the autosave logic for the day if it exists
                if (daySection.autosaveHandler) {
                    daySection.dispatchEvent(new Event('input'));
                }
            } else {
                showCustomAlert("Error: Could not find row to update.", "error");
            }

            currentMcqTarget = null;
        });
		
		
	// 2a. "Delete All MCQs" Button Handler
        document.getElementById('delete-all-mcqs-btn')?.addEventListener('click', () => {
            if (!currentMcqTarget) return;
            
            if (!confirm("Are you sure you want to delete all MCQs for this row?")) {
                return;
            }

            const { monthId, weekId, dayIndex, rowIndex } = currentMcqTarget;
            
            // Clear textarea
            mcqPasteTextarea.value = '';
            
            closeModal('add-mcq-modal');

            // Find the UI button
            const daySection = document.querySelector(`[data-month-id="${monthId}"] [data-week-id="${weekId}"] [data-day-index="${dayIndex}"]`);
            const row = daySection ? daySection.querySelector(`tr[data-row-index="${rowIndex}"]`) : null;
            const button = row ? row.querySelector('.add-row-mcq-btn') : null;

            if (button) {
                // 1. Send empty array to indicate deletion
                button.dataset.tempMcq = '[]'; 
                
                // 2. Reset UI
                button.innerHTML = `<i class="fas fa-plus mr-1"></i> Add Qs`;
                button.classList.remove('bg-emerald-100', 'text-emerald-700');
                
                showCustomAlert("All MCQs removed. Click 'Save Day' to confirm.", "success");

                // 3. Trigger Autosave
                if (daySection.autosaveHandler) {
                    daySection.dispatchEvent(new Event('input'));
                }
            }

            currentMcqTarget = null;
        });
		
		
		
       // 3. ✨ The Magic Parser Function (UPDATED: Detects (ক)/(a) style options)
        function parseMcqText(text) {
            // ১. টেক্সট ক্লিন করা (অপ্রয়োজনীয় স্পেস কমানো)
            let cleanText = text.replace(/\r\n/g, '\n');

            const mcqData = [];

            // ২. নতুন উন্নত Regex (Dual Numbering Support: 1. ১. format)
            // ব্যাখ্যা:
            // (?:^|\n)\s*([0-9]+)\.       -> শুরুতে ইংরেজি নম্বর খুঁজবে (যেমন: 1.)
            // (?:\s*[০-৯]+\.)?            -> এরপর যদি বাংলা নম্বর থাকে (যেমন: ১.) তবে সেটাও স্কিপ করবে।
            // ((?:(?!\n\s*a[\)\.]).)+)    -> এরপর অপশন 'a)' বা 'a.' আসার আগ পর্যন্ত সব টেক্সট প্রশ্নের অংশ হিসেবে নেবে।
            
            const mcqRegex = /(?:^|\n)\s*([0-9]+)\.(?:\s*[০-৯]+\.)?\s*((?:(?!\n\s*(?:[\(]?(?:ক|a)[\.\)])).)+)\n\s*(?:[\(]?(?:ক|a)[\.\)])\s*([\s\S]+?)\n\s*(?:[\(]?(?:খ|b)[\.\)])\s*([\s\S]+?)\n\s*(?:[\(]?(?:গ|c)[\.\)])\s*([\s\S]+?)\n\s*(?:[\(]?(?:ঘ|d)[\.\)])\s*([\s\S]+?)\n\s*(?:(?:সঠিক উত্তর)|(?:Correct Answer)|(?:Answer)|(?:Ans))[:\s]*([\s\S]+?)(?:\n\s*(?:Note|নোট|ব্যাখ্যা)[:\s]*([\s\S]+?))?(?=\n\s*\d+\.|$)/gi;

            let match;
            while ((match = mcqRegex.exec(cleanText)) !== null) {
                // ডাটাগুলো ভেরিয়েবলে নেওয়া
                const id = match[1].trim();
                const question = match[2].trim();
                const optionA = match[3].trim();
                const optionB = match[4].trim();
                const optionC = match[5].trim();
                const optionD = match[6].trim();
                let correctAns = match[7].trim();
                const explanation = match[8] ? match[8].trim() : ""; // নোট যদি থাকে

                // ৩. সঠিক উত্তরটি ক্লিন করা (যাতে 'a', 'b' বা অতিরিক্ত চিহ্ন না থাকে)
                // এটি শুধু মূল উত্তরটুকু রাখবে (যেমন: "a) উত্তর" থেকে শুধু "উত্তর" রাখবে)
                correctAns = correctAns.replace(/^[a-dgdক-ঘ][\)\.]\s*/i, '').trim();

                mcqData.push({
                    id: parseInt(id),
                    question: question,
                    options: [optionA, optionB, optionC, optionD],
                    correctAnswer: correctAns,
                    explanation: explanation
                });
            }

            return mcqData;
        }
		
		
		


// 4. "View MCQ" Button Handler (UPDATED: Captures Subject)
async function openViewMcqModal(monthId, weekId, dayIndex, rowIndex) {
    const viewMcqContent = document.getElementById('view-mcq-content');
    const subtitle = document.getElementById('view-mcq-subtitle');
    const modal = document.getElementById('view-mcq-modal');
    const modalTitle = modal.querySelector('h3');

    viewMcqContent.innerHTML = '<p class="text-center text-gray-500 italic py-10"><i class="fas fa-spinner fa-spin text-2xl"></i><br>Loading MCQs...</p>';
    modal.style.display = 'block';

    try {
        const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
        const weekDocSnap = await getDoc(weekDocRef);
        if (!weekDocSnap.exists()) throw new Error("Week document not found.");

        const dayData = weekDocSnap.data().days?.[dayIndex];
        if (!dayData) throw new Error("Day data not found.");

        let mcqData = [];
        let mainTitleText = `Day-${dayData.dayNumber} MCQs`;
        let subTitleText = "";
        let subjectName = "Quick Test"; // Default

        if (rowIndex !== null) {
            // Single Row Mode
            const row = dayData.rows?.[rowIndex];
            mcqData = row?.mcqData || [];
            const subject = row?.subject || "No Subject";
            const topic = row?.topic || "No Topic";
            subTitleText = `${subject} | ${topic}`;
            subjectName = subject; // Capture the real subject
        } else {
            // All Day Mode
            mcqData = dayData.rows?.reduce((acc, row) => {
                if (row.mcqData) {
                    acc.push(...row.mcqData);
                }
                return acc;
            }, []) || [];
            subTitleText = "All Questions";
            
            // Optional: If all rows have the same subject, use it. Otherwise 'Aggregated'
            const subjects = new Set(dayData.rows?.filter(r => r.mcqData && r.mcqData.length > 0).map(r => r.subject));
            if (subjects.size === 1) {
                subjectName = [...subjects][0];
            } else {
                subjectName = "Aggregated";
            }
        }

        if (modalTitle) modalTitle.textContent = mainTitleText;
        if (subtitle) subtitle.textContent = subTitleText;

        if (!mcqData || mcqData.length < 1) {
            viewMcqContent.innerHTML = '<div class="text-center py-10 text-gray-500">No MCQs found for this selection.</div>';
            currentViewMcqData = null; 
            return;
        }

        currentViewMcqData = {
            title: `${mainTitleText} - ${subTitleText}`,
            mcqs: mcqData,
            subject: subjectName // Store it for the test button
        };

        let html = '';
        mcqData.forEach((mcq, index) => {
            // Check if there is a valid correct answer
            let answerHtml = '';
            
            if (mcq.correctAnswer) {
                 const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
                 const correctLabel = (correctIndex !== -1) ? getOptionLabel(correctIndex, mcq.question) : '?';
                 answerHtml = `
                    <div class="inline-flex items-center w-full sm:w-auto bg-emerald-100 border border-emerald-300 rounded-lg px-4 py-2 shadow-sm answer-card-bg">
                        <div class="flex-shrink-0 bg-emerald-200 rounded-full p-1 mr-3 text-emerald-700 answer-icon-bg"><i class="fas fa-check text-xs"></i></div>
                        <div class="font-semibold text-emerald-900 text-sm answer-text">Correct: <span class="text-emerald-800 answer-label">${correctLabel}. ${escapeHtml(mcq.correctAnswer)}</span></div>
                    </div>`;
            } else {
                 answerHtml = `
                    <div class="inline-flex items-center w-full sm:w-auto bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 shadow-sm">
                        <div class="flex-shrink-0 bg-amber-200 rounded-full p-1 mr-3 text-amber-700"><i class="fas fa-exclamation text-xs"></i></div>
                        <div class="font-semibold text-amber-900 text-sm">Note: <span class="text-amber-800">${escapeHtml(mcq.explanation || "No Answer Defined")}</span></div>
                    </div>`;
            }

            // --- NEW: DISPLAY NOTE BELOW ANSWER ---
            let noteHtml = '';
            if (mcq.note) {
                // Added 'explanation-text' class
                noteHtml = `
                    <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 explanation-text">
                        <span class="font-bold"><i class="fas fa-info-circle mr-1"></i> Explanation:</span> ${escapeHtml(mcq.note)}
                    </div>
                `;
            }
            // --------------------------------------

            html += `
                <div class="study-card">
                    <div class="study-question text-gray-900 font-medium">
                        <span class="text-indigo-600 font-bold mr-1">${index + 1}.</span>${escapeHtml(mcq.question)}
                    </div>
                    <div class="study-options">
                        ${mcq.options.map((opt, i) => `
                            <div class="study-opt text-gray-900"><span class="font-bold text-black mr-2">${getOptionLabel(i, mcq.question)}.</span>${escapeHtml(opt)}</div>
                        `).join('')}
                    </div>
                    <div class="mt-4 pt-2 border-t border-dashed border-gray-200">
                        ${answerHtml}
                        ${noteHtml} 
                    </div>
                </div>
            `;
        });
		
        viewMcqContent.innerHTML = html;

    } catch (error) {
        console.error("Error loading MCQs for viewing:", error);
        viewMcqContent.innerHTML = '<p class="text-center text-red-500 py-10">Could not load MCQs.</p>';
        currentViewMcqData = null;
    }
}


	
		/**
         * Fetches all vocab from all days *before* the specified date.
         * @param {string} currentMonthId - The month ID (e.g., "2025-10")
         * @param {string} currentWeekId - The week ID (e.g., "week2")
         * @param {number | null} currentDayIndex - The day index (e.g., 0) OR null if it's a week quiz.
         */
        async function getGlobalVocabPool(currentMonthId, currentWeekId, currentDayIndex = null) {
            const allWords = new Set();
            const allBanglaMeanings = new Set();
            const allSynonyms = new Set();

            try {
                const plansCollectionPath = getUserPlansCollectionPath();
                const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
                const querySnapshot = await getDocs(q);

                for (const docSnap of querySnapshot.docs) {
                    const monthId = docSnap.id;
                    if (monthId > currentMonthId) break; 
                    
                    // --- START: MODIFIED ---
                    const weeksCollectionRef = collection(db, docSnap.ref.path, 'weeks');
                    const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                    // --- END: MODIFIED ---

                    const weekIds = ['week1', 'week2', 'week3', 'week4'].sort(); // Ensure correct order

                    for (const weekId of weekIds) {
                        if (monthId === currentMonthId && weekId > currentWeekId) break; 

                        if (currentDayIndex === null && monthId === currentMonthId && weekId === currentWeekId) break;

                        // Get the week doc from our query snapshot
                        const weekDoc = weeksQuerySnapshot.docs.find(d => d.id === weekId);
                        if (!weekDoc) continue;
                        
                        const weekData = weekDoc.data();
                        if (!weekData || !weekData.days) continue;

                        for (let dayIndex = 0; dayIndex < weekData.days.length; dayIndex++) {
                            if (currentDayIndex !== null && monthId === currentMonthId && weekId === currentWeekId && dayIndex >= currentDayIndex) break;

                            const day = weekData.days[dayIndex];
                            for (const row of day.rows) {
                                if (row.subject?.toLowerCase() === 'vocabulary' && row.vocabData) {
                                    const processedVocab = preProcessVocab(row.vocabData);
                                    processedVocab.forEach(v => {
                                        if (v.word) allWords.add(v.word);
                                        if (v.banglaMeaning) allBanglaMeanings.add(v.banglaMeaning);
                                        if (v.synonym) allSynonyms.add(v.synonym);
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error building global vocab pool:", error);
            }

            return {
                allWords: [...allWords],
                allBanglaMeanings: [...allBanglaMeanings],
                allSynonyms: [...allSynonyms]
            };
        }
		
		// 5. "Quiz" বাটনে ক্লিক করলে (Vocabulary-এর জন্য)
        async function startQuiz(monthId, weekId, dayIndex, rowIndex) {
            quizTitle.textContent = 'Vocabulary Quiz';
            window.currentQuizSourceInfo = { monthId, weekId, dayIndex, rowIndex };
            currentMcqTarget = null; 
            
            // --- START: FIX FOR OVERLAPPING SCREENS ---
            quizModal.style.display = "block";
            
            // Force hide Main, Results, and Review screens using inline styles
            quizMainScreen.classList.add('hidden');
            quizMainScreen.style.display = 'none'; 
            
            quizResultsScreen.classList.add('hidden');
            quizResultsScreen.style.display = 'none'; // This line fixes the issue
            
            quizReviewScreen.classList.add('hidden');
            quizReviewScreen.style.display = 'none';

            // Show Start Screen
            quizStartScreen.classList.remove('hidden');
            quizStartScreen.style.display = ''; 
            // --- END: FIX FOR OVERLAPPING SCREENS ---
            
            quizStartMessage.textContent = "Loading vocabulary...";
            quizStartBtn.classList.add('hidden');
            document.getElementById('quiz-total-time-warning').style.display = 'none';

            try {
                // --- START: MODIFIED ---
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);
                if (!weekDocSnap.exists()) throw new Error("Week document not found.");

                const rowData = weekDocSnap.data().days?.[dayIndex]?.rows?.[rowIndex];
                // --- END: MODIFIED ---
                
                if (!rowData) throw new Error("Row data not found.");

                window.currentQuizSubjectInfo = { subjectName: rowData.subject || "Vocabulary", topicDetail: "Row Vocabulary" };
                const vocabData = rowData.vocabData;

                if (!vocabData || vocabData.length < 4) { 
                    quizStartMessage.textContent = "You need at least 4 vocabulary words in this row to start a quiz.";
                    return;
                }
            
                const questionList = preProcessVocab(vocabData);
                currentVocabData = questionList; 
                currentMcqData = null; 

                quizStartMessage.textContent = "Loading global vocabulary pool...";
                let optionPool = await getGlobalVocabPool(monthId, weekId, dayIndex);

                if (optionPool.allWords.length < 4) {
                    console.warn("No previous vocab found. Using current day's vocab as option pool.");
                    optionPool = {
                        allWords: questionList.map(v => v.word),
                        allBanglaMeanings: questionList.map(v => v.banglaMeaning),
                        allSynonyms: questionList.map(v => v.synonym).filter(Boolean)
                    };
                } else {
                    questionList.forEach(v => {
                        if(v.word) optionPool.allWords.push(v.word);
                        if(v.banglaMeaning) optionPool.allBanglaMeanings.push(v.banglaMeaning);
                        if (v.synonym) optionPool.allSynonyms.push(v.synonym);
                    });
                }

                currentOptionPool = optionPool;
                currentQuizQuestions = []; 
                
                const totalQuestions = questionList.length + questionList.filter(v => v.synonym).length;
                const totalTimeInSeconds = totalQuestions * 15;
                
                const warningP = document.getElementById('quiz-total-time-warning');
                warningP.querySelector('span').textContent = formatTime(totalTimeInSeconds);
                warningP.style.display = 'block';
                
                quizStartMessage.textContent = `Ready to test yourself on ${vocabData.length} words from this day's voacb?`;
                quizStartBtn.classList.remove('hidden');
                
                const newStartBtn = quizStartBtn.cloneNode(true);
                quizStartBtn.parentNode.replaceChild(newStartBtn, quizStartBtn);
                newStartBtn.addEventListener('click', runQuizGame);
                quizStartBtn = newStartBtn; 
                
            } catch (error) {
                console.error("Error loading vocab quiz data:", error);
                quizStartMessage.textContent = "Could not load quiz data. Please try again.";
                window.currentQuizSubjectInfo = { subjectName: 'Vocabulary', topicDetail: 'Error loading topic' }; 
            }
        }
		
		
        // 5. "MCQ Test" বাটনে ক্লিক করলে (UPGRADED)
        async function startMcqQuiz(monthId, weekId, dayIndex, rowIndex) {
            quizTitle.textContent = 'MCQ Quiz';
			currentMcqTarget = { monthId, weekId, dayIndex, rowIndex };
			
            // --- START: FIX FOR OVERLAPPING SCREENS ---
            quizModal.style.display = "block";
            
            // Force hide Main, Results, and Review screens using inline styles
            quizMainScreen.classList.add('hidden');
            quizMainScreen.style.display = 'none'; 
            
            quizResultsScreen.classList.add('hidden');
            quizResultsScreen.style.display = 'none';
            
            quizReviewScreen.classList.add('hidden');
            quizReviewScreen.style.display = 'none';

            // Show Start Screen
            quizStartScreen.classList.remove('hidden');
            quizStartScreen.style.display = ''; 
            // --- END: FIX FOR OVERLAPPING SCREENS ---

            quizStartMessage.textContent = "Loading quiz data...";
            quizStartBtn.classList.add('hidden');
            document.getElementById('quiz-total-time-warning').style.display = 'none';
            
            try {
                // --- START: MODIFIED ---
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);
                if (!weekDocSnap.exists()) throw new Error("Week document not found.");

                const dayData = weekDocSnap.data().days?.[dayIndex];
                // --- END: MODIFIED ---
                
                if (!dayData) throw new Error("Day data not found.");
                
                const rowData = dayData?.rows?.[rowIndex]; 
                const subjectName = rowData?.subject || 'MCQ';
                const topicDetail = rowData?.topic || 'N/A';
                window.currentQuizSubjectInfo = { subjectName, topicDetail };
                
                let mcqData = [];

                if (rowIndex !== null) {
                    mcqData = dayData.rows?.[rowIndex]?.mcqData || [];
                } else {
                    mcqData = dayData.rows?.reduce((acc, row) => {
                        if (row.mcqData) {
                            acc.push(...row.mcqData);
                        }
                        return acc;
                    }, []) || [];
                }

                if (!mcqData || mcqData.length < 1) { 
                    quizStartMessage.textContent = "No MCQs found to start a quiz.";
                    return;
                }

                currentMcqData = mcqData;
                currentVocabData = null;
                currentQuizQuestions = currentMcqData.map(mcq => ({
                    question: mcq.question,
                    options: [...mcq.options],
                    correctAnswer: mcq.correctAnswer,
					explanation: mcq.explanation || null,
					note: mcq.note || null,
                    userAnswer: null,
                    isCorrect: null
                }));
                
                const totalQuestions = currentQuizQuestions.length;
                const totalTimeInSeconds = totalQuestions * 40;
                
                const warningP = document.getElementById('quiz-total-time-warning');
                warningP.querySelector('span').textContent = formatTime(totalTimeInSeconds);
                warningP.style.display = 'block';
                
                quizStartMessage.textContent = `Ready to test yourself on ${mcqData.length} MCQs?`;
                quizStartBtn.classList.remove('hidden');
                
                const newStartBtn = quizStartBtn.cloneNode(true);
                quizStartBtn.parentNode.replaceChild(newStartBtn, quizStartBtn);
                newStartBtn.addEventListener('click', runQuizGame);
                quizStartBtn = newStartBtn; 
                
            } catch (error) {
                console.error("Error loading MCQ quiz data:", error);
                quizStartMessage.textContent = "Could not load quiz data. Please try again.";
                window.currentQuizSubjectInfo = { subjectName: 'MCQ', topicDetail: 'Error loading topic' };
            }
        }

        // --- END: NEW MCQ FEATURE LOGIC ---
		
		// --- START: NEW MASTER MCQ LIST & QUIZ CENTER LOGIC ---

        // 1. DOM Elements
        
        const masterMcqContent = document.getElementById('master-mcq-content');
        const totalMcqCountSpan = document.getElementById('total-mcq-count');
        const mcqQuizCenterModal = document.getElementById('mcq-quiz-center-modal');
        const mcqQuizCenterContent = document.getElementById('mcq-quiz-center-content');

        

			

        // 4. Add listener for the "Test Yourself" button in the Master MCQ List
        document.getElementById('show-mcq-quiz-center-btn').addEventListener('click', openMcqQuizCenter);

        // 5. Function to build the MCQ Quiz Center (LOGIC FIXED)
        async function openMcqQuizCenter() {
            mcqQuizCenterModal.style.display = "block";
            mcqQuizCenterContent.innerHTML = '<p class="text-center text-gray-500 italic py-5">Loading available quizzes...</p>';

            let quizCenterHtml = '';
            let quizzesFound = 0;

            try {
                const plansCollectionPath = getUserPlansCollectionPath();
                const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
                const querySnapshot = await getDocs(q);

                for (const docSnap of querySnapshot.docs) {
                    const monthId = docSnap.id;
                    const monthData = docSnap.data();
                    const monthName = monthData.monthName || monthId;

                    let monthMcqs = [];
                    let monthHtml = `<h3>${monthName}</h3>`;
                    let monthHasMcqs = false;
                    
                    // --- START: MODIFIED ---
                    const weeksCollectionRef = collection(db, docSnap.ref.path, 'weeks');
                    const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                    // --- END: MODIFIED ---

                    for (const weekId of ['week1', 'week2', 'week3', 'week4']) {
                        // --- START: MODIFIED ---
                        const weekDoc = weeksQuerySnapshot.docs.find(d => d.id === weekId);
                        if (!weekDoc) continue;
                        const weekData = weekDoc.data();
                        // --- END: MODIFIED ---
                        
                        if (!weekData || !weekData.days) continue;

                        let weekMcqs = [];
                        let weekHtml = `<h4>${weekId.replace('week', 'Week ')}</h4>`;
                        let weekHasMcqs = false;

                        for (let dayIndex = 0; dayIndex < weekData.days.length; dayIndex++) {
                            const day = weekData.days[dayIndex];
                            
                            const dayMcqs = day.rows?.reduce((acc, row) => {
                                if (row.mcqData) acc.push(...row.mcqData);
                                return acc;
                            }, []) || [];

                            if (dayMcqs.length > 0) {
                                quizzesFound++;
                                monthHasMcqs = true;
                                weekHasMcqs = true;
                                weekMcqs.push(...dayMcqs);
                                
                                weekHtml += `<button class="mcq-center-btn day-btn" data-quiz-type="day" data-month-id="${monthId}" data-week-id="${weekId}" data-day-index="${dayIndex}">
                                    Day ${day.dayNumber} (${dayMcqs.length} MCQs)
                                </button>`;
                            }
                        }

                        if (weekHasMcqs) {
                            monthMcqs.push(...weekMcqs);
                            weekHtml = `
                                <h4>${weekId.replace('week', 'Week ')}</h4>
                                <button class="mcq-center-btn week-btn" data-quiz-type="week" data-month-id="${monthId}" data-week-id="${weekId}">
                                    Test All Week ${weekId.replace('week', '')} MCQs (${weekMcqs.length})
                                </button>
                                ${weekHtml.substring(weekHtml.indexOf('</h4>') + 5)}
                            `;
                            monthHtml += weekHtml;
                        }
                    }

                    if (monthHasMcqs) {
                        monthHtml = `
                            <h3>${monthName}</h3>
                            <button class="mcq-center-btn month-btn" data-quiz-type="month" data-month-id="${monthId}">
                                Test All ${monthName} MCQs (${monthMcqs.length})
                            </button>
                            ${monthHtml.substring(monthHtml.indexOf('</h3>') + 5)}
                        `;
                        quizCenterHtml += monthHtml;
                    }
                }

                if (quizzesFound === 0) {
                    mcqQuizCenterContent.innerHTML = '<p class="text-center text-gray-500 italic py-5">No MCQ quizzes available. Add MCQs to any day to start.</p>';
                } else {
                    mcqQuizCenterContent.innerHTML = quizCenterHtml;
                }

            } catch (error) {
                console.error("Error loading MCQ quizzes:", error);
                mcqQuizCenterContent.innerHTML = '<p class="text-center text-red-500 py-5">Could not load quizzes.</p>';
            }
        }

        // 6. Add listener for the new MCQ Quiz Center buttons
        mcqQuizCenterContent.addEventListener('click', (e) => {
            const button = e.target.closest('.mcq-center-btn');
            if (button) {
                const { quizType, monthId, weekId, dayIndex } = button.dataset;
                startAggregatedMcqQuiz(quizType, monthId, weekId, dayIndex);
            }
        });

        // 7. Function to start a quiz (day, week, or month) (LOGIC FIXED)
        async function startAggregatedMcqQuiz(quizType, monthId, weekId = null, dayIndex = null) {
            quizTitle.textContent = 'MCQ Quiz';
			currentMcqTarget = { quizType, monthId, weekId, dayIndex };
            closeModal('mcq-quiz-center-modal');
			
            // --- START: FIX FOR OVERLAPPING SCREENS ---
            quizModal.style.display = "block";
            
            // Force hide Main, Results, and Review screens
            quizMainScreen.classList.add('hidden');
            quizMainScreen.style.display = 'none';
            
            quizResultsScreen.classList.add('hidden');
            quizResultsScreen.style.display = 'none'; // Critical fix
            
            quizReviewScreen.classList.add('hidden');
            quizReviewScreen.style.display = 'none';

            // Show Start Screen
            quizStartScreen.classList.remove('hidden');
            quizStartScreen.style.display = '';
            // --- END: FIX FOR OVERLAPPING SCREENS ---
            
            quizStartMessage.textContent = `Loading ${quizType} quiz...`;
            quizStartBtn.classList.add('hidden');
            document.getElementById('quiz-total-time-warning').style.display = 'none';

            try {
                // --- START: MODIFIED ---
                const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);
                const weeksCollectionRef = collection(db, monthDocRef.path, 'weeks');
                // --- END: MODIFIED ---
                
                let aggregatedMcqs = [];
                let quizTitle = '';

                if (quizType === 'day') {
                    const weekDocRef = doc(weeksCollectionRef, weekId);
                    const weekDocSnap = await getDoc(weekDocRef);
                    if (!weekDocSnap.exists()) throw new Error("Week document not found.");
                    
                    const day = weekDocSnap.data().days?.[dayIndex];
                    if (!day) throw new Error("Day data not found.");
                    
                    day.rows?.forEach(row => {
                        if (row.mcqData) aggregatedMcqs.push(...row.mcqData);
                    });
                    quizTitle = `Day ${day.dayNumber} - ${weekId.replace('week', 'Week ')}`;
                    
                } else if (quizType === 'week') {
                    const weekDocRef = doc(weeksCollectionRef, weekId);
                    const weekDocSnap = await getDoc(weekDocRef);
                    if (!weekDocSnap.exists()) throw new Error("Week document not found.");
                    
                    const weekData = weekDocSnap.data();
                    if (weekData && weekData.days) {
                        for (const day of weekData.days) {
                            day.rows?.forEach(row => {
                                if (row.mcqData) aggregatedMcqs.push(...row.mcqData);
                            });
                        }
                    }
                    quizTitle = `${weekId.replace('week', 'Week ')} - ${monthId}`;
                    
                } else if (quizType === 'month') {
                    const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                    for (const weekDocSnap of weeksQuerySnapshot.docs) {
                        const weekData = weekDocSnap.data();
                        if (weekData && weekData.days) {
                            for (const day of weekData.days) {
                                day.rows?.forEach(row => {
                                    if (row.mcqData) aggregatedMcqs.push(...row.mcqData);
                                });
                            }
                        }
                    }
                    quizTitle = `${monthId} - All MCQs`;
                }
				
                window.currentQuizSubjectInfo = { subjectName: "Aggregated", topicDetail: quizTitle };
                if (aggregatedMcqs.length === 0) {
                    quizStartMessage.textContent = "No MCQs found for this selection.";
                    return;
                }
                
                currentMcqData = aggregatedMcqs; 
                currentVocabData = null;
                currentQuizQuestions = currentMcqData.map(mcq => ({ 
                    question: mcq.question,
                    options: [...mcq.options],
                    correctAnswer: mcq.correctAnswer,
					explanation: mcq.explanation || null,
					note: mcq.note || null,
                    userAnswer: null,
                    isCorrect: null
                }));
                
                const totalQuestions = currentQuizQuestions.length;
                const totalTimeInSeconds = totalQuestions * 40;
                
                const warningP = document.getElementById('quiz-total-time-warning');
                warningP.querySelector('span').textContent = formatTime(totalTimeInSeconds);
                warningP.style.display = 'block';
                
                quizStartMessage.textContent = `Ready to test yourself on ${aggregatedMcqs.length} MCQs from: ${quizTitle}?`;
                quizStartBtn.classList.remove('hidden');
                
                const newStartBtn = quizStartBtn.cloneNode(true);
                quizStartBtn.parentNode.replaceChild(newStartBtn, quizStartBtn);
                newStartBtn.addEventListener('click', runQuizGame);
                quizStartBtn = newStartBtn; 
                
            } catch (error) {
                console.error("Error loading aggregated MCQ quiz data:", error);
                quizStartMessage.textContent = "Could not load quiz data. Please try again.";
                window.currentQuizSubjectInfo = { subjectName: 'Aggregated', topicDetail: 'Error loading topic' }; 
            }
        }

        // --- END: NEW MASTER MCQ LIST & QUIZ CENTER LOGIC ---
		
		// --- START: NEW TIMER HELPER FUNCTIONS ---
        function pad(num) {
            return num.toString().padStart(2, '0');
        }

        function formatTime(totalSeconds) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            if (hours > 0) {
                return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            }
            return `${pad(minutes)}:${pad(seconds)}`;
        }
        // --- END: NEW TIMER HELPER FUNCTIONS ---
		
		// --- START: NEW 2-FACTOR DELETE FUNCTIONS ---

        /**
         * ধাপ ২: দ্বিতীয় কনফার্মেশন মোডালটি দেখায়
         */
        function showDeleteMonthSecondStep(monthId, monthName) {
            currentMonthDeleteTarget = { monthId, monthName }; // টার্গেট সেভ করুন
            const challengePhrase = `I want to delete ${monthId}'s entirely`;

            // মোডালটি প্রস্তুত করুন
            deleteMonthTitle.textContent = `Final Confirmation: Delete ${monthName}?`;
            deleteMonthChallengeText.textContent = challengePhrase;
            deleteMonthInput.value = ''; // ইনপুট ক্লিয়ার করুন
            deleteMonthError.classList.add('hidden'); // এরর হাইড করুন
            deleteMonthInput.classList.remove('input-error');
            deleteMonthConfirmBtn.disabled = true; // বাটনটি ডিজেবল করুন

            deleteMonthConfirmModal.style.display = 'block';
            deleteMonthInput.focus();
        }

        /**
         * ইনপুট টাইপ করার সময় বাটন এনাবল/ডিজেবল করে
         */
        deleteMonthInput.addEventListener('input', () => {
            if (!currentMonthDeleteTarget) return;
            const challengePhrase = `I want to delete ${currentMonthDeleteTarget.monthId}'s entirely`;
            
            if (deleteMonthInput.value === challengePhrase) {
                deleteMonthConfirmBtn.disabled = false;
                deleteMonthError.classList.add('hidden');
                deleteMonthInput.classList.remove('input-error');
            } else {
                deleteMonthConfirmBtn.disabled = true;
            }
        });

        /**
         * ধাপ ৩: "ফাইনাল ডিলিট" বাটনে ক্লিক করলে কল হয়
         */
        deleteMonthConfirmBtn.addEventListener('click', () => {
            if (!currentMonthDeleteTarget) return;
            
            const { monthId } = currentMonthDeleteTarget;
            const challengePhrase = `I want to delete ${monthId}'s entirely`;

            if (deleteMonthInput.value === challengePhrase) {
                // ম্যাচ করেছে!
                closeModal('delete-month-confirm-modal');
                deleteMonth(monthId); // আসল ডিলিট ফাংশনটি কল করুন
                currentMonthDeleteTarget = null;
            } else {
                // ম্যাচ করেনি
                deleteMonthError.classList.remove('hidden');
                deleteMonthInput.classList.add('input-error');
                deleteMonthInput.value = '';
            }
        });

        /**
         * ক্যানসেল বাটনে ক্লিক করলে
         */
        deleteMonthCancelBtn.addEventListener('click', () => {
            closeModal('delete-month-confirm-modal');
            currentMonthDeleteTarget = null;
        });

        // --- END: NEW 2-FACTOR DELETE FUNCTIONS ---
		
		// --- START: NEW SAVE QUIZ RESULT LOGIC ---
document.getElementById('quiz-save-btn').addEventListener('click', async () => {
    if (!currentQuizResultData) {
        showCustomAlert("No result data to save.", "error");
        return;
    }
    if (!currentUser || !userId) {
        showCustomAlert("You must be logged in to save results.", "error");
        return;
    }

    // const saveBtn = document.getElementById('quiz-save-btn'); // <-- REMOVED CONST
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Saving...`;

    try {
        const resultsCollectionPath = getUserResultsCollectionPath();
        const resultsCollection = collection(db, resultsCollectionPath);
        
        // Add the timestamp *now*
        currentQuizResultData.saveTimestamp = Timestamp.now();
        
        await addDoc(resultsCollection, currentQuizResultData);

        // Invalidate cache
        savedResultsCache = null;

        showCustomAlert("Result saved successfully!", "success");
        saveBtn.innerHTML = `<i class="fas fa-check mr-2"></i>Saved!`;
        // We leave it disabled to prevent duplicate saves

    } catch (error) {
        console.error("Error saving quiz result:", error);
        showCustomAlert("Could not save result. Please try again.", "error");
        saveBtn.disabled = false; // Re-enable on error
        saveBtn.innerHTML = `<i class="fas fa-save mr-2"></i>Save`;
    }
});
// --- END: NEW SAVE QUIZ RESULT LOGIC ---


// --- START: NEW RESULT SHEET LOGIC ---

// --- DOM Elements for Result Sheet ---
const resultSheetModal = document.getElementById('result-sheet-modal');
const showResultsSheetBtn = document.getElementById('show-results-sheet-btn');

// --- MODIFIED ---
const tabBtnByDay = document.getElementById('tab-btn-by-day');
const tabBtnBySubject = document.getElementById('tab-btn-by-subject');
const tabContentByDay = document.getElementById('tab-content-by-day');
const tabContentBySubject = document.getElementById('tab-content-by-subject');
const byDayResultsList = document.getElementById('by-day-results-list');
const subjectSubTabsNav = document.getElementById('subject-sub-tabs-nav');
const subjectSubTabsContent = document.getElementById('subject-sub-tabs-content');
// --- END MODIFIED ---

const savedQuizReviewBtn = document.getElementById('saved-quiz-review-btn');
let tempSavedReviewData = null; // Holds questions for the review button

// --- Open the Result Sheet ---
showResultsSheetBtn.addEventListener('click', () => {
    resultSheetModal.style.display = 'block';
    loadAndDisplayResults();
});

// --- Tab Switching ---
tabBtnByDay.addEventListener('click', () => {
    tabBtnByDay.classList.add('active-tab');
    tabBtnBySubject.classList.remove('active-tab');
    tabContentByDay.classList.remove('hidden');
    tabContentBySubject.classList.add('hidden');
});
tabBtnBySubject.addEventListener('click', () => {
    tabBtnBySubject.classList.add('active-tab');
    tabBtnByDay.classList.remove('active-tab');
    tabContentBySubject.classList.remove('hidden');
    tabContentByDay.classList.add('hidden');
});

// --- Fetch and Render Data ---
async function loadAndDisplayResults() {
    if (!currentUser || !userId) {
        byDayResultsList.innerHTML = `<p class="text-center text-red-500 py-10">Please log in to see results.</p>`;
        subjectSubTabsContent.innerHTML = `<p class="text-center text-red-500 py-10">Please log in to see results.</p>`;
        return;
    }

    // Use cache if available
    if (savedResultsCache) {
        console.log("Loading results from cache...");
        renderResults(savedResultsCache);
        return;
    }

    // Set loading state
    byDayResultsList.innerHTML = `<p class="text-center text-gray-500 italic py-10">Loading all results...</p>`;
    subjectSubTabsNav.innerHTML = '';
    subjectSubTabsContent.innerHTML = `<p class="text-center text-gray-500 italic py-10">Loading subject results...</p>`;

    try {
        console.log("Fetching results from Firestore...");
        const resultsCollectionPath = getUserResultsCollectionPath();
        const q = query(collection(db, resultsCollectionPath), orderBy("saveTimestamp", "desc"));
        
        const querySnapshot = await getDocs(q);
        
        const allResults = [];
        querySnapshot.forEach((doc) => {
            allResults.push({ id: doc.id, ...doc.data() });
        });

        savedResultsCache = allResults; // Store in cache
        renderResults(allResults);

    } catch (error) {
        console.error("Error fetching results:", error);
        byDayResultsList.innerHTML = `<p class="text-center text-red-500 py-10">Error loading results.</p>`;
        subjectSubTabsContent.innerHTML = `<p class="text-center text-red-500 py-10">Error loading results.</p>`;
    }
}

// --- Render Helper (UPGRADED for "By Day" and "By Subject") ---
function renderResults(allResults) {
    
    // --- 1. Render "By Day" Tab ---
    const byDayStats = calculateOverallStats(allResults); // Stats for ALL results
    // We pass 'by-day' to createResultsTable to use the correct topicName
    byDayResultsList.innerHTML = createResultsTable(allResults, 'by-day', byDayStats);

    // --- 2. Render "By Subject" Tab ---
    
    // Group results by subjectName
    const subjectGroups = {};
    allResults.forEach(res => {
        // Normalize subject name, or default to "Aggregated"
        const subject = res.subjectName || 'Aggregated';
        if (!subjectGroups[subject]) {
            subjectGroups[subject] = [];
        }
        subjectGroups[subject].push(res);
    });

    // Get sorted list of subject names
    // We want "Aggregated" to be last.
    const subjectNames = Object.keys(subjectGroups).sort((a, b) => {
        if (a === 'Aggregated') return 1;
        if (b === 'Aggregated') return -1;
        return a.localeCompare(b);
    });
    
    if (subjectNames.length === 0) {
        subjectSubTabsNav.innerHTML = '';
        subjectSubTabsContent.innerHTML = `<p class="text-center text-gray-500 italic py-10">No subject-specific results found.</p>`;
    } else {
        // Create sub-tab navigation
        subjectSubTabsNav.innerHTML = subjectNames.map((subject, index) => `
            <button class="result-tab-btn ${index === 0 ? 'active-tab' : ''}" data-subject-tab="${escapeHtml(subject)}">
                ${escapeHtml(subject)}
            </button>
        `).join('');

        // Create sub-tab content
        subjectSubTabsContent.innerHTML = subjectNames.map((subject, index) => {
            const resultsForSubject = subjectGroups[subject];
            const subjectStats = calculateOverallStats(resultsForSubject);
            const subjectId = subject.replace(/[^a-zA-Z0-9]/g, '-'); // Create a safe ID
            // We pass 'by-subject' to createResultsTable to use the topicDetail
            return `
                <div id="sub-tab-content-${subjectId}" class="result-tab-content ${index === 0 ? '' : 'hidden'}">
                    ${createResultsTable(resultsForSubject, 'by-subject', subjectStats)}
                </div>
            `;
        }).join('');

        // Add event listeners for sub-tabs
        subjectSubTabsNav.querySelectorAll('.result-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all nav buttons and hide all content
                subjectSubTabsNav.querySelectorAll('.result-tab-btn').forEach(b => b.classList.remove('active-tab'));
                subjectSubTabsContent.querySelectorAll('.result-tab-content').forEach(c => c.classList.add('hidden'));
                
                // Activate the clicked one
                btn.classList.add('active-tab');
                const subject = btn.dataset.subjectTab;
                const contentId = `sub-tab-content-${subject.replace(/[^a-zA-Z0-9]/g, '-')}`;
                document.getElementById(contentId)?.classList.remove('hidden');
            });
        });
    }

    // --- 3. Attach Listeners for "View" buttons and links ---
    // (These must be re-attached every time we render)
    attachViewResultListeners(allResults);
    attachTopicLinkListeners(); 
    attachChartButtonListeners(); 
}
	
// --- ৫. মোট হিসাব করার জন্য নতুন ফাংশন ---
function calculateOverallStats(results) {
    let totalObtained = 0;
    let totalFull = 0;
    let totalTime = 0;

    results.forEach(res => {
        totalObtained += res.finalScore;
        totalFull += res.totalQuestions;
        totalTime += res.timeTakenInSeconds;
    });

    const overallPercentage = (totalFull > 0) ? (Math.max(0, totalObtained) / totalFull) * 100 : 0;

    return {
        totalObtained: totalObtained,
        totalFull: totalFull,
        totalTime: totalTime,
        overallPercentage: overallPercentage.toFixed(1)
    };
}

// --- Create Table HTML ---
// --- Create Table HTML (UPGRADED for "By Day" and "By Subject") ---
function createResultsTable(results, tableType, stats) { 
    if (results.length === 0) {
        return `<p class="text-center text-gray-500 italic py-10">No results found for this view.</p>`;
    }

    const rows = results.map((res, index) => {
        const date = res.saveTimestamp?.toDate ? res.saveTimestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'N/A';
        
        // --- NEW LOGIC: Choose which topic name to display ---
        let topicDisplayName = '';
        if (tableType === 'by-day') {
            topicDisplayName = res.topicName; // e.g., "Basic View - Day 2..."
        } else { // 'by-subject'
            topicDisplayName = res.topicDetail; // e.g., "Chapter 1: Intro" or "Vocabulary"
        }
        
        // --- Topic link logic (remains the same) ---
        const topicLinkHtml = `
            <a href="${res.topicLink || '#'}" class="topic-link" 
               data-link="${res.topicLink || '#'}" 
               data-link-type="${res.topicLink?.startsWith('#day') ? 'day' : (res.topicLink ? 'modal' : 'none')}">
                ${escapeHtml(topicDisplayName)}
            </a>
        `;
        
        return `
            <tr>
                <td class="sl-col">${index + 1}</td>
                <td class="date-col">${date}</td>
                <td class="topic-col">${topicLinkHtml}</td>
                <td class="score-col">${res.finalScore.toFixed(2)}</td>
                <td class="score-col">${res.totalQuestions}</td>
                <td class="time-col">${formatTime(res.timeTakenInSeconds)}</td> 
                <td class="percent-col ${res.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}">${res.percentage}%</td>
                <td class="view-col">
                    <button class="action-button action-button-secondary text-xs view-saved-result-btn" data-result-id="${res.id}">
                        <i class="fas fa-eye mr-1"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Determine chart type for the button
    const chartButtonType = (tableType === 'by-day') ? 'all' : 'subject';

    return `
        <table>
            <thead>
                <tr>
                    <th class="sl-col">SL.</th>
                    <th class="date-col">Date</th>
                    <th class="topic-col">Exam Topic</th>
                    <th class="score-col">Obtained</th>
                    <th class="score-col">Full</th> 
                    <th class="time-col">Time Taken</th> 
                    <th class="percent-col">Percentage</th>
                    <th class="view-col">Summary</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="3">Overall Performance</th>
                    <th class="score-col">${stats.totalObtained.toFixed(2)}</th>
                    <th class="score-col">${stats.totalFull}</th>
                    <th class="time-col">${formatTime(stats.totalTime)}</th>
                    <th class="percent-col">${stats.overallPercentage}%</th>
                    <th class="view-col">
                        <button class="action-button progress-chart-btn" data-chart-type="${chartButtonType}">
                            <i class="fas fa-chart-line mr-1"></i> Your Progress
                        </button>
                        </th>
                </tr>
            </tfoot>
        </table>
    `;
}

// --- Attach Listeners for "View" Buttons ---
function attachViewResultListeners(allResults) {
    const allButtons = document.querySelectorAll('.view-saved-result-btn');
    allButtons.forEach(btn => {
        // Prevent multiple listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const resultId = newBtn.dataset.resultId;
            // Find the full result object from our cached array
            const resultData = allResults.find(r => r.id === resultId);
            if (resultData) {
                openSavedResultModal(resultData);
            } else {
                showCustomAlert("Could not find result data.", "error");
            }
        });
    });
}

// --- ৩. টপিক লিঙ্কের জন্য নতুন লিসেনার ---
function attachTopicLinkListeners() {
    document.querySelectorAll('.topic-link').forEach(link => {
        // একাধিক লিসেনার যোগ করা এড়াতে লিঙ্কটি প্রতিস্থাপন করুন
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const linkUrl = newLink.dataset.link;
            const linkType = newLink.dataset.linkType;

            if (linkType === 'day') {
                closeModal('result-sheet-modal'); // রেজাল্ট মোডাল বন্ধ করুন
                
                // লিঙ্কটি একটি অ্যাঙ্কর লিঙ্ক (e.g., #day-2025-10-week1-0)
                // আমাদের প্রথমে মাসটি লোড করতে হবে
                const parts = linkUrl.substring(1).split('-'); // #day-2025-10-week1-0
                const monthId = `${parts[1]}-${parts[2]}`; // 2025-10
                const anchor = linkUrl.substring(1); // The full ID, e.g., "day-2025-10-week1-0"
                
                // মাসটি প্রদর্শন করুন এবং অ্যাঙ্কর লিঙ্কটি পাস করুন
                displayMonthPlan(monthId, anchor);

            } else if (linkType === 'modal') {
                // এটি একটি কুইজ সেন্টার লিঙ্ক
                // closeModal('result-sheet-modal'); // <-- এই লাইনটি রিমুভ করা হয়েছে
                if (linkUrl === '#mcq-quiz-center') {
                    openMcqQuizCenter();
                } else if (linkUrl === '#vocab-quiz-center') {
                    openQuizCenter();
                }
            }
            // যদি linkType 'none' হয় তবে কিছুই করবেন না
        });
    });
}

// --- Open the "View Saved Result" Modal ---
function openSavedResultModal(resultData) {
    document.getElementById('saved-result-topic-name').textContent = resultData.topicName;
    document.getElementById('saved-summary-answered-count').textContent = resultData.answeredCount;
    document.getElementById('saved-summary-correct-count').textContent = resultData.correctCount;
    document.getElementById('saved-summary-correct-score').textContent = `+${resultData.correctScore.toFixed(2)}`;
    document.getElementById('saved-summary-wrong-count').textContent = resultData.wrongCount;
    document.getElementById('saved-summary-wrong-score').textContent = resultData.wrongScore.toFixed(2);
    document.getElementById('saved-summary-not-answered-count').textContent = resultData.notAnsweredCount;
    document.getElementById('saved-summary-not-answered-score').textContent = `0.00`;
    document.getElementById('saved-summary-final-score').textContent = resultData.finalScore.toFixed(2);
    document.getElementById('saved-summary-percentage').textContent = `${resultData.percentage.toFixed(1)}%`;
    document.getElementById('saved-summary-time-taken').textContent = formatTime(resultData.timeTakenInSeconds);

    // Show/Hide review button
    if (resultData.wrongCount > 0) {
        savedQuizReviewBtn.style.display = 'inline-flex';
        // Pass the question data to a temp variable for the review button to use
        tempSavedReviewData = resultData.questions;
    } else {
        savedQuizReviewBtn.style.display = 'none';
        tempSavedReviewData = null;
    }

    document.getElementById('view-saved-result-modal').style.display = 'block';
}

// --- Listener for the "Review Wrong" button in the SAVED modal ---
savedQuizReviewBtn.addEventListener('click', () => {
    if (!tempSavedReviewData) {
        showCustomAlert("No review data found.", "error");
        return;
    }
    
    // We re-use the *existing* quiz review screen, but populate it with saved data
    
    // 1. Set the main quiz variable to our saved data
    currentQuizQuestions = tempSavedReviewData;
    
    // 2. Call the existing review function
    showReviewScreen(); // This is the function from line ~1890
    
    // 3. Show the main quiz modal and hide the "saved result" modal
    closeModal('view-saved-result-modal');
    quizModal.style.display = 'block';
    
    // 4. Ensure the quiz modal is showing the *review* screen, not the start/main/results screen
    quizStartScreen.classList.add('hidden');
    quizMainScreen.classList.add('hidden');
    quizResultsScreen.classList.add('hidden');
    quizReviewScreen.classList.remove('hidden');
});

// --- Listener for the "Try Again" button in the SAVED modal ---
document.getElementById('saved-quiz-restart-btn').addEventListener('click', () => {
    if (!tempSavedReviewData) {
        showCustomAlert("No quiz data found to restart.", "error");
        return;
    }
    
    // ১. গ্লোবাল কুইজ স্টেট সেট করুন
    currentVocabData = null; // সোর্স ক্লিয়ার করুন
    currentMcqData = null; // সোর্স ক্লিয়ার করুন

    // --- START: FIX ---
    // প্রশ্নগুলোকে " পরিষ্কার" করতে হবে (পুরনো উত্তর মুছে ফেলতে হবে)
    const cleanQuestions = tempSavedReviewData.map(q => {
        // ...q (স্প্রেড অপারেটর) দিয়ে পুরনো প্রশ্নটি কপি করুন
        // তারপর userAnswer এবং isCorrect রিসেট করুন
        return {
            ...q, // প্রশ্ন, অপশন, সঠিক উত্তর কপি করুন
            userAnswer: null, // পুরনো উত্তর রিসেট করুন
            isCorrect: null   // পুরনো স্ট্যাটাস রিসেট করুন
        };
    });
    
    currentQuizQuestions = cleanQuestions; // পরিষ্কার প্রশ্নগুলো গ্লোবাল ভেরিয়েবলে সেট করুন
    // --- END: FIX ---
    
    // ২. "View Saved Result" মোডালটি বন্ধ করুন
    closeModal('view-saved-result-modal');
    
    // ৩. প্রধান কুইজ মোডালটি দেখান
    quizModal.style.display = 'block';
    
    // ৪. runQuizGame() ফাংশনটি কল করুন
    // এটি null সোর্স দেখে ফলব্যাক লজিক ব্যবহার করবে, অর্থাৎ সেভ করা প্রশ্নগুলোকেই আবার শাফল (shuffle) করবে
    runQuizGame();
});

// --- END: NEW RESULT SHEET LOGIC ---

		// --- START: NEW PROGRESS CHART LOGIC ---

/**
 * Attaches click listeners to the "Your Progress" buttons in the footer
 */
function attachChartButtonListeners() {
    document.querySelectorAll('.progress-chart-btn').forEach(btn => {
        // Prevent multiple listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            if (!savedResultsCache) {
                showCustomAlert("Results data not found.", "error");
                return;
            }
            
            const type = newBtn.dataset.chartType; // 'all' or 'subject'
            let results = [];
            let title = '';

            if (type === 'all') {
                results = savedResultsCache;
                title = 'Overall Quiz Progress';
            } else { // 'subject'
                // --- START: FIX ---
                // Find the active subject tab *from the nav container*
                const subjectTab = subjectSubTabsNav.querySelector('.result-tab-btn.active-tab'); 
                // --- END: FIX ---
                const subjectName = subjectTab ? subjectTab.dataset.subjectTab : 'Unknown';
                results = savedResultsCache.filter(r => (r.subjectName || 'Aggregated') === subjectName);
                title = `${subjectName} Quiz Progress`;
            }
            
            openProgressChart(results, title); // <-- Pass title instead of type
        });
    });
}

/**
 * Prepares data and opens the chart modal
 */
function openProgressChart(results, title) {
    if (results.length === 0) {
        showCustomAlert("No data to display in chart.", "error");
        return;
    }

    const labels = [];
    const data = [];

    // Results are (desc), we must reverse them to (asc) for the chart
    results.slice().reverse().forEach(res => {
        // Format date as YYYY-MM-DD for consistency
        const date = res.saveTimestamp?.toDate ? res.saveTimestamp.toDate().toLocaleDateString('en-CA') : 'Unknown';
        labels.push(date);
        data.push(res.percentage);
    });
    
    document.getElementById('chart-modal-title').textContent = title;
    
    // Render the chart
    renderProgressChart(labels, data, title);
    
    // Show the modal
    document.getElementById('chart-modal').style.display = 'block';
}

/**
 * Renders the line chart using Chart.js
 */
function renderProgressChart(labels, data, title) {
    // Destroy the old chart instance if it exists
    if (progressChart) {
        progressChart.destroy();
    }
    
    const ctx = document.getElementById('progress-chart-canvas').getContext('2d');
    
    // Create a gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)'); // emerald-500
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Percentage (%)',
                data: data,
                fill: true,
                backgroundColor: gradient, // Gradient fill
                borderColor: '#10b981', // emerald-500
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#10b981',
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#ffffff',
                borderWidth: 3,
                tension: 0.1 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%'; // Add % to Y-axis
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide the "Percentage (%)" label
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Score: ${context.parsed.y}%`; // Tooltip text
                        }
                    }
                }
            }
        }
    });
}

// --- Helper for Summary Tables ---
function createSummaryCellHtml(topicsArray) {
    if (!topicsArray || topicsArray.length === 0) {
        return '<span class="text-gray-300">-</span>';
    }

    // Join content with dividers
    const fullContent = topicsArray.map(t => escapeHtml(t)).join('<br><hr class="my-1 border-gray-200">');
    
    // Always return the structure with a hidden button. 
    // We will verify overflow in the UI using updateSummaryButtons().
    return `
        <div class="summary-cell-wrapper">
            <div class="summary-cell-content">${fullContent}</div>
            <button class="summary-read-more-btn" style="display: none;" onclick="toggleSummaryRow(this)">...more</button>
        </div>
    `;
}

function updateSummaryButtons() {
    // Use requestAnimationFrame to ensure the DOM has updated layout
    requestAnimationFrame(() => {
        document.querySelectorAll('.summary-cell-wrapper').forEach(wrapper => {
            const content = wrapper.querySelector('.summary-cell-content');
            const btn = wrapper.querySelector('.summary-read-more-btn');
            
            if (content && btn) {
                // Check if content height exceeds visible height (plus 1px buffer)
                if (content.scrollHeight > content.clientHeight + 1) {
                    btn.style.display = 'inline-block';
                } else {
                    btn.style.display = 'none';
                }
            }
        });
    });
}

// Global function for the onclick event
window.toggleSummaryRow = function(btn) {
    // Find the parent TR
    const row = btn.closest('tr');
    if (row) {
        // Toggle the class on the ROW so all cells in this row expand together
        row.classList.toggle('expanded');
        
        // Update button text logic
        const isExpanded = row.classList.contains('expanded');
        // Find all buttons in this row to update their text
        row.querySelectorAll('.summary-read-more-btn').forEach(b => {
            b.textContent = isExpanded ? 'less' : '...more';
        });
    }
};

		
		// Helper to rebuild the Main Summary Table with Pagination & Color
        function getPaginatedMainTableHtml(sourceElementId) {
            const sourceDiv = document.getElementById(sourceElementId);
            const originalTable = sourceDiv ? sourceDiv.querySelector('table') : null;
            
            if (!originalTable) {
                return sourceDiv ? sourceDiv.innerHTML : ''; 
            }

            const MAX_ROWS_PER_PAGE = 11;
            const theadHtml = originalTable.querySelector('thead').innerHTML;
            const rows = Array.from(originalTable.querySelectorAll('tbody tr'));
            
            let html = '';
            let rowCount = 0;
            let isFirstTable = true;

            const startTable = () => {
                const breakHtml = isFirstTable ? '' : '<div style="page-break-before: always;"></div>';
                isFirstTable = false;
                rowCount = 1; 
                
                return `${breakHtml}
                    <table class="summary-print-table">
                        <thead>${theadHtml}</thead>
                        <tbody>`;
            };

            html += startTable();

            rows.forEach(row => {
                if (rowCount >= MAX_ROWS_PER_PAGE) {
                    html += `</tbody></table>${startTable()}`;
                }

                let newRowHtml = row.outerHTML;
                if (row.querySelector('td[colspan]')) {
                     html += newRowHtml.replace('class="', 'class="summary-section-header ');
                } else {
                    html += newRowHtml.replace('class="', 'class="summary-data-row ');
                }
                
                rowCount++;
            });

            html += '</tbody></table>';
            return html;
        }
		
        // --- START: PRINT FUNCTIONALITY (MOBILE ORIENTATION FIX) ---

        function printSummaryContent(contentId, title, headerHTML, extraContentHTML = '') {
            return new Promise((resolve, reject) => {
                // 1. Generate Paginated Main Table HTML
                const mainTableHTML = getPaginatedMainTableHtml(contentId);

                if (!mainTableHTML) {
                    showCustomAlert("No content to print.", "error");
                    resolve(); 
                    return;
                }

                // 2. CLEANUP: Remove ANY existing print iframe
                const existingIframe = document.querySelector('iframe[name="print-frame"]');
                if (existingIframe) {
                    document.body.removeChild(existingIframe);
                }

                // 3. Create a hidden Iframe
                const iframe = document.createElement('iframe');
                iframe.name = "print-frame";
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);

                // 4. Define Styles (INCLUDES NEW SUMMARY CSS)
                const styles = `
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Kalpurush:wght@400;700&display=swap');
                        
                        @page {
                            size: A4 landscape;
                            margin: 0.5cm; 
                            margin-bottom: 1cm; 
                        }
                        body {
                            font-family: 'Inter', 'Kalpurush', sans-serif;
                            padding: 20px;
                            color: #1f2937;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            background-color: white;
                            display: flex;
                            flex-direction: column;
                            min-height: 95vh; 
                        }
                        
                        /* HEADER & INFO */
                        .print-header-container { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
                        h1 { color: #059669; margin: 0 0 10px 0; font-size: 24px; }
                        .meta-info { display: flex; justify-content: center; gap: 30px; font-size: 14px; color: #374151; font-weight: 600; }
                        .user-info-row { display: flex; justify-content: center; gap: 20px; margin-top: 8px; font-size: 12px; color: #4b5563; font-weight: 500; }
                        .user-info-row span { font-weight: 600; color: #1f2937; }
                        
                        /* MAIN SUMMARY TABLE STYLES */
                        table.summary-print-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                        .summary-print-table thead th { background-color: #1f2937 !important; color: white !important; font-weight: bold; text-transform: uppercase; font-size: 11px; padding: 8px 10px; border: 1px solid #374151; text-align: center; }
                        .summary-print-table td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
                        .summary-print-table tr td[colspan] { background-color: #047857 !important; color: white !important; font-weight: bold; text-align: center; }
                        .summary-print-table tbody tr:nth-child(even) { background-color: #f9fafb; }
                        .summary-print-table td:first-child { font-weight: 600; text-align: center; color: #1f2937; }
                        .summary-print-table td:last-child { font-weight: 700; text-align: center; color: #4b5563; }

                        /* Read More Button Cleanup */
                        .summary-read-more-btn { display: none !important; }
                        .summary-cell-content { max-height: none !important; -webkit-line-clamp: unset !important; display: block !important; overflow: visible !important; }
                        .summary-cell-wrapper { display: block; }

                        /* VOCAB STYLES */
                        .vocab-section-title { color: #059669; text-align: center; margin-top: 30px; margin-bottom: 10px; font-size: 18px; font-weight: bold; page-break-before: always; }
                        
                        .vocab-print-table { width: 100%; border-collapse: collapse; font-size: 16px; margin-bottom: 0; } 
                        .vocab-print-table th, .vocab-print-table td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: middle; }
                        
                        .vocab-main-header th { background-color: #1f2937 !important; color: white !important; text-align: center; font-weight: bold; font-size: 14px; }
                        .vocab-week-header td { background-color: #047857 !important; color: white !important; font-weight: bold; text-align: center; font-size: 18px; padding: 8px; }
                        .vocab-day-header td { background-color: #10b981 !important; color: white !important; font-weight: bold; text-align: center; }
                        .vocab-data-row:nth-child(even) { background-color: #f9fafb; }
                        .vocab-col-divider { border-right: 2px solid #6b7280 !important; }

                        /* --- NEW SUMMARY STYLES --- */
                        .vocab-summary-container { 
                            margin-top: 25px; 
                            padding: 15px; 
                            background-color: #f9fafb; 
                            border: 1px solid #e5e7eb; 
                            border-radius: 8px; 
                            page-break-inside: avoid; 
                            width: fit-content;
                            min-width: 250px;
                        }
                        .summary-title { 
                            font-size: 16px; 
                            font-weight: 700; 
                            color: #059669; 
                            border-bottom: 2px solid #10b981; 
                            padding-bottom: 5px; 
                            margin-bottom: 10px; 
                        }
                        .summary-line { 
                            font-size: 14px; 
                            color: #374151; 
                            margin-bottom: 4px; 
                            font-weight: 600;
                        }
                        .month-total {
                            font-size: 15px;
                            color: #1f2937;
                            margin-bottom: 8px;
                        }
                        .week-breakdown {
                            padding-left: 10px;
                            border-left: 3px solid #d1fae5;
                        }

                        /* FOOTER */
                        .print-footer { 
                            margin-top: auto; 
                            padding-top: 30px; 
                            padding-bottom: 20px; 
                            text-align: center; 
                            font-size: 12px; 
                            color: #6b7280; 
                            border-top: 2px solid #10b981; 
                            background-color: white; 
                            page-break-inside: avoid; 
                        }
                        .print-footer a { color: #059669; text-decoration: none; font-weight: 600; }
                        
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        thead { display: table-header-group; }
                        tfoot { display: table-footer-group; }
                    </style>
                `;

                // 5. Build HTML
                let htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head><title>${title}</title>${styles}</head>
                    <body>
                        <div class="print-header-container">
                            <h1>${title}</h1>
                            ${headerHTML}
                        </div>
                        ${mainTableHTML}
                `;

                if (extraContentHTML) {
                    htmlContent += `
                        <div class="vocab-section">
                            <h2 class="vocab-section-title">Vocabulary List</h2>
                            ${extraContentHTML}
                        </div>
                    `;
                }

                htmlContent += `
                        <div class="print-footer">
                            Visit us at: <a href="https://classcaddy.netlify.app/">https://classcaddy.netlify.app/</a>
                        </div>
                    </body></html>
                `;

                // 6. Write content
                const frameDoc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
                frameDoc.open();
                frameDoc.write(htmlContent);
                frameDoc.close();

                // 7. Execute Print
                setTimeout(() => {
                    try {
                        if (!iframe.contentWindow) {
                            throw new Error("Iframe window lost");
                        }
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } catch (e) {
                        console.error("Print execution failed:", e);
                    } finally {
                        resolve(); 
                    }
                }, 1000);
            });
        }
		
		
		
        function getMonthNameFromIndex(index) {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return months[index] || "Unknown";
        }

// Helper to generate the Colorful Vocab Table with Summary (WORDS ONLY)
        // Helper to generate the Colorful Vocab Table with Summary (CORRECTED COUNT)
        async function fetchAndBuildVocabHtml(monthId, weekId = null) {
            let html = `
                <table class="vocab-print-table">
                    <thead>
                        <tr class="vocab-main-header">
                            <th style="width: 11%;">Word</th>
                            <th style="width: 14%;">Meaning</th>
                            <th style="width: 8%;" class="vocab-col-divider">Syn</th>
                            
                            <th style="width: 11%;">Word</th>
                            <th style="width: 14%;">Meaning</th>
                            <th style="width: 8%;" class="vocab-col-divider">Syn</th>
                            
                            <th style="width: 11%;">Word</th>
                            <th style="width: 14%;">Meaning</th>
                            <th style="width: 9%;">Syn</th>
                        </tr>
                    </thead>
                    <tbody>`;

            try {
                // --- 1. CALCULATE MONTH NAME ---
                const parts = monthId.split('-');
                const monthIndex = parseInt(parts[1]) - 1;
                const monthName = getMonthNameFromIndex(monthIndex);

                // --- 2. DATA FETCHING ---
                let weeksToProcess = [];
                
                if (weekId) {
                    const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                    const weekDoc = await getDoc(weekDocRef);
                    if (weekDoc.exists()) {
                        weeksToProcess.push({ id: weekId, data: weekDoc.data() });
                    }
                } else {
                    const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);
                    const weeksCollectionRef = collection(db, monthDocRef.path, 'weeks');
                    const weeksSnapshot = await getDocs(weeksCollectionRef);
                    weeksSnapshot.forEach(doc => weeksToProcess.push({ id: doc.id, data: doc.data() }));
                    weeksToProcess.sort((a, b) => a.id.localeCompare(b.id));
                }

                // --- 3. INITIALIZE COUNTERS ---
                let totalVocabCount = 0; 
                const weekCounts = {};   

                let hasVocab = false;

                for (const week of weeksToProcess) {
                    const weekData = week.data;
                    if (!weekData.days) continue;

                    let weekHasVocab = false;
                    let weekBufferHtml = ''; 
                    
                    if (!weekCounts[week.id]) weekCounts[week.id] = 0;

                    if (!weekId) {
                        weekBufferHtml += `<tr class="vocab-week-header"><td colspan="9">${week.id.replace('week', 'Week ')}</td></tr>`;
                    }

                    for (const day of weekData.days) {
                        let dayVocab = [];
                        
                        day.rows?.forEach(row => {
                            // --- FIX: Check if vocabData exists, ignore Subject Name ---
                            if (row.vocabData && row.vocabData.length > 0) {
                                const processed = preProcessVocab(row.vocabData);
                                dayVocab.push(...processed);
                                
                                // --- COUNTING LOGIC (WORDS ONLY) ---
                                processed.forEach(v => {
                                    // Count if the Word exists (matches the Table Logic)
                                    if (v.word && v.word.trim()) {
                                        totalVocabCount++;
                                        weekCounts[week.id]++;
                                    }
                                });
                                // -----------------------------------
                            }
                        });

                        if (dayVocab.length > 0) {
                            hasVocab = true;
                            weekHasVocab = true;

                            if (weekBufferHtml) {
                                html += weekBufferHtml;
                                weekBufferHtml = ''; 
                            }

                            html += `<tr class="vocab-day-header"><td colspan="9">Day ${day.dayNumber}</td></tr>`;

                            for (let i = 0; i < dayVocab.length; i += 3) {
                                const v1 = dayVocab[i];
                                const v2 = dayVocab[i+1];
                                const v3 = dayVocab[i+2];

                                html += `<tr class="vocab-data-row">
                                    <td>${escapeHtml(v1.word)}</td>
                                    <td>${escapeHtml(v1.banglaMeaning)}</td>
                                    <td class="vocab-col-divider">${escapeHtml(v1.synonym || '-')}</td>
                                    
                                    <td>${v2 ? escapeHtml(v2.word) : ''}</td>
                                    <td>${v2 ? escapeHtml(v2.banglaMeaning) : ''}</td>
                                    <td class="vocab-col-divider">${v2 ? escapeHtml(v2.synonym || '-') : ''}</td>

                                    <td>${v3 ? escapeHtml(v3.word) : ''}</td>
                                    <td>${v3 ? escapeHtml(v3.banglaMeaning) : ''}</td>
                                    <td>${v3 ? escapeHtml(v3.synonym || '-') : ''}</td>
                                </tr>`;
                            }
                        }
                    }
                }

                html += `</tbody></table>`;

                // --- 4. APPEND SUMMARY SECTION ---
                if (hasVocab) {
                    let weekSummaryHtml = Object.keys(weekCounts).sort().map(wId => {
                        // Only show weeks that have content
                        if (weekCounts[wId] > 0) {
                            const wLabel = wId.replace('week', 'Week-');
                            return `<div class="summary-line week-total">${wLabel}: ${weekCounts[wId]}</div>`;
                        }
                        return '';
                    }).join('');

                    html += `
                        <div class="vocab-summary-container">
                            <div class="summary-title">Total Vocabularies: ${totalVocabCount}</div>
                            <div class="summary-line month-total">Month: ${monthName} - ${totalVocabCount}</div>
                            <div class="week-breakdown">
                                ${weekSummaryHtml}
                            </div>
                        </div>
                    `;
                }

                if (!hasVocab) return ''; 
                return html;

            } catch (e) {
                console.error("Error building vocab table:", e);
                return '<p style="color:red; text-align:center;">Error loading vocabulary data.</p>';
            }
        }
		
        // Event Listener: Week Summary Print
        document.getElementById('print-week-summary-btn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            
            if (btn.dataset.processing === "true") return; 
            btn.dataset.processing = "true";
            
            const monthId = btn.dataset.monthId;
            const weekId = btn.dataset.weekId;
            
            const originalIcon = btn.innerHTML;
            if (!originalIcon.includes('fa-print')) {
                 btn.innerHTML = `<i class="fas fa-print mr-1.5"></i> Print`; 
            }
            
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Preparing...`;
            btn.disabled = true;
            
            try {
                let headerHTML = '';
                if (monthId && weekId) {
                    const parts = monthId.split('-');
                    const year = parts[0];
                    const monthIndex = parseInt(parts[1]) - 1;
                    const monthName = getMonthNameFromIndex(monthIndex);
                    const weekNum = weekId.replace('week', '').padStart(2, '0');

                    headerHTML += `
                        <div class="meta-info">
                            <div class="meta-item">Year: <span>${year}</span></div>
                            <div class="meta-item">Month: <span>${monthName}</span></div>
                            <div class="meta-item">Week: <span>${weekNum}</span></div>
                        </div>
                    `;
                }

                const activeUser = currentUser || auth.currentUser;
                if (activeUser) {
                    const userName = activeUser.displayName || 'Guest';
                    const userEmail = activeUser.email || '';
                    headerHTML += `
                        <div class="user-info-row">
                            <div>Name: <span>${escapeHtml(userName)}</span></div>
                            ${userEmail ? `<div>Email: <span>${escapeHtml(userEmail)}</span></div>` : ''}
                        </div>
                    `;
                }

                const vocabHtml = await fetchAndBuildVocabHtml(monthId, weekId);
                await printSummaryContent('week-summary-content', 'Weekly Study Summary', headerHTML, vocabHtml);
                
            } catch (error) {
                console.error(error);
                showCustomAlert("Failed to prepare print document.", "error");
            } finally {
                if (originalIcon.includes('fa-print')) {
                    btn.innerHTML = originalIcon;
                } else {
                    btn.innerHTML = `<i class="fas fa-print mr-1.5"></i> Print`;
                }
                btn.disabled = false;
                btn.dataset.processing = "false";
            }
        });

        // Event Listener: Month Summary Print
        document.getElementById('print-month-summary-btn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            
            if (btn.dataset.processing === "true") return; 
            btn.dataset.processing = "true";
            
            const monthId = btn.dataset.monthId;
            
            const originalIcon = btn.innerHTML;
            if (!originalIcon.includes('fa-print')) {
                 btn.innerHTML = `<i class="fas fa-print mr-1.5"></i> Print`; 
            }
            
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Preparing...`;
            btn.disabled = true;

            try {
                let headerHTML = '';
                if (monthId) {
                    const parts = monthId.split('-');
                    const year = parts[0];
                    const monthIndex = parseInt(parts[1]) - 1;
                    const monthName = getMonthNameFromIndex(monthIndex);

                    headerHTML += `
                        <div class="meta-info">
                            <div class="meta-item">Year: <span>${year}</span></div>
                            <div class="meta-item">Month: <span>${monthName}</span></div>
                        </div>
                    `;
                }

                const activeUser = currentUser || auth.currentUser;
                if (activeUser) {
                    const userName = activeUser.displayName || 'Guest';
                    const userEmail = activeUser.email || '';
                    headerHTML += `
                        <div class="user-info-row">
                            <div>Name: <span>${escapeHtml(userName)}</span></div>
                            ${userEmail ? `<div>Email: <span>${escapeHtml(userEmail)}</span></div>` : ''}
                        </div>
                    `;
                }

                const vocabHtml = await fetchAndBuildVocabHtml(monthId, null);
                await printSummaryContent('month-summary-content', 'Monthly Study Summary', headerHTML, vocabHtml);
                
            } catch (error) {
                console.error(error);
                showCustomAlert("Failed to prepare print document.", "error");
            } finally {
                if (originalIcon.includes('fa-print')) {
                    btn.innerHTML = originalIcon;
                } else {
                    btn.innerHTML = `<i class="fas fa-print mr-1.5"></i> Print`;
                }
                btn.disabled = false;
                btn.dataset.processing = "false";
            }
        });

        // --- END: PRINT FUNCTIONALITY ---
		
		
	// --- START: POMODORO TIMER LOGIC (LOCKED TABS & BASE64 SOUND) ---
        
        const pomoWidget = document.getElementById('pomodoro-widget');
        const pomoIcon = document.getElementById('pomodoro-icon');
        const pomoTimerDisplay = document.getElementById('pomo-timer-display');
        const pomoStartBtn = document.getElementById('pomo-start-btn');
        const pomoResetBtn = document.getElementById('pomo-reset-btn');
        const pomoBtnFocus = document.getElementById('pomo-btn-focus');
        const pomoBtnBreak = document.getElementById('pomo-btn-break');
        const pomoProgressBar = document.getElementById('pomo-progress-bar');
        const pomoIconTime = document.getElementById('pomo-icon-time');
        
        // Settings Elements
        const pomoSettingsToggle = document.getElementById('pomo-settings-toggle');
        const pomoTimerView = document.getElementById('pomo-timer-view');
        const pomoSettingsView = document.getElementById('pomo-settings-view');
        const pomoInputFocus = document.getElementById('pomo-input-focus');
        const pomoInputBreak = document.getElementById('pomo-input-break');
        const pomoSaveSettingsBtn = document.getElementById('pomo-save-settings-btn');

        // Pleasant Digital Alarm Sound (Base64 encoded to ensure it plays)
        const pomoAlarm = new Audio("data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
        
        // State Variables
        let pomoLocalInterval = null;
        let pomoState = {
            status: 'idle', 
            mode: 'focus',  
            endTime: null,  
            remaining: 25 * 60, 
            totalDuration: 25 * 60,
            config: { focus: 25, break: 5 }
        };
        let pomoUnsubscribe = null;

        // 1. Initialize & Auth Listener
        function initPomodoro() {
            // UI Listeners
            pomoStartBtn.addEventListener('click', handlePomoToggle);
            pomoResetBtn.addEventListener('click', handlePomoReset);
            
            // --- NEW: CONDITIONAL TAB SWITCHING ---
            pomoBtnFocus.addEventListener('click', () => {
                if (pomoState.mode === 'focus') return; // Already active
                if (isTimerActive()) {
                    showCustomAlert("Timer is active. Reset it to switch modes.", "error");
                    return;
                }
                handlePomoSwitchMode('focus');
            });

            pomoBtnBreak.addEventListener('click', () => {
                if (pomoState.mode === 'break') return; // Already active
                if (isTimerActive()) {
                    showCustomAlert("Timer is active. Reset it to switch modes.", "error");
                    return;
                }
                handlePomoSwitchMode('break');
            });
            // --------------------------------------
            
            // Settings Listeners
            pomoSettingsToggle.addEventListener('click', () => {
                const isSettingsOpen = !pomoSettingsView.classList.contains('hidden');
                if (isSettingsOpen) {
                    pomoSettingsView.classList.add('hidden');
                    pomoTimerView.classList.remove('hidden');
                    pomoInputFocus.value = pomoState.config.focus;
                    pomoInputBreak.value = pomoState.config.break;
                } else {
                    pomoTimerView.classList.add('hidden');
                    pomoSettingsView.classList.remove('hidden');
                }
            });

            pomoSaveSettingsBtn.addEventListener('click', async () => {
                const fVal = parseInt(pomoInputFocus.value) || 25;
                const bVal = parseInt(pomoInputBreak.value) || 5;
                
                // If timer is running/paused, we only update config, not current time
                const updates = { config: { focus: fVal, break: bVal } };

                // Only auto-update the remaining time if the timer is FRESH (not started yet)
                if (!isTimerActive()) {
                    if (pomoState.mode === 'focus') {
                        updates.remaining = fVal * 60;
                        updates.totalDuration = fVal * 60;
                    } else {
                        updates.remaining = bVal * 60;
                        updates.totalDuration = bVal * 60;
                    }
                }

                await updatePomoDoc(updates);
                
                pomoSettingsView.classList.add('hidden');
                pomoTimerView.classList.remove('hidden');
                showCustomAlert(`Settings saved!`, "success");
            });
            
            // Minimize Logic
            document.getElementById('pomo-minimize-btn').addEventListener('click', () => {
                pomoWidget.classList.add('hidden');
                pomoIcon.classList.remove('hidden');
            });
            pomoIcon.addEventListener('click', () => {
                pomoIcon.classList.add('hidden');
                pomoWidget.classList.remove('hidden');
            });

            // 2. Listen for Auth Changes
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    startPomoSync(user.uid);
                } else {
                    stopPomoSync();
                }
            });
        }

        // Helper: Check if timer has started or is paused mid-way
        function isTimerActive() {
            // It is active if it's RUNNING, or if it's PAUSED but some time has elapsed
            return pomoState.status === 'running' || (pomoState.status === 'paused' && pomoState.remaining < pomoState.totalDuration);
        }

        // 3. Sync Logic
        function startPomoSync(uid) {
            if (pomoUnsubscribe) pomoUnsubscribe();
            
            const docRef = doc(db, `artifacts/${appId}/users/${uid}/pomodoro`, 'state');
            
            pomoUnsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    pomoState = { ...pomoState, ...data };
                    
                    if (data.config) {
                        pomoInputFocus.value = data.config.focus;
                        pomoInputBreak.value = data.config.break;
                    }

                    renderPomoUI();
                } else {
                    updatePomoDoc({
                        status: 'idle',
                        mode: 'focus',
                        endTime: null,
                        remaining: 25 * 60,
                        totalDuration: 25 * 60,
                        config: { focus: 25, break: 5 }
                    });
                }
            });
        }

        function stopPomoSync() {
            if (pomoUnsubscribe) pomoUnsubscribe();
            clearInterval(pomoLocalInterval);
            pomoTimerDisplay.textContent = "25:00";
            pomoProgressBar.style.width = "0%";
        }

        // 4. DB Helper
        async function updatePomoDoc(data) {
            if (!userId) return;
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/pomodoro`, 'state');
            await setDoc(docRef, data, { merge: true });
        }

        // 5. Action Handlers
        async function handlePomoToggle() {
            // Trick: Play silent sound on user interaction to unlock Audio Context for later
            pomoAlarm.volume = 0.1; // Set low volume just in case
            pomoAlarm.play().then(() => {
                pomoAlarm.pause();
                pomoAlarm.currentTime = 0;
                pomoAlarm.volume = 1.0; // Restore volume
            }).catch(e => {});

            if (pomoState.status === 'running') {
                // PAUSE
                const now = Date.now();
                const timeLeft = Math.max(0, Math.ceil((pomoState.endTime - now) / 1000));
                
                await updatePomoDoc({
                    status: 'paused',
                    remaining: timeLeft,
                    endTime: null
                });
            } else {
                // START
                const now = Date.now();
                const targetEndTime = now + (pomoState.remaining * 1000);
                
                await updatePomoDoc({
                    status: 'running',
                    endTime: targetEndTime
                });
            }
        }

        async function handlePomoReset() {
            const defaultTime = (pomoState.mode === 'focus' ? pomoState.config.focus : pomoState.config.break) * 60;
            await updatePomoDoc({
                status: 'idle',
                remaining: defaultTime,
                totalDuration: defaultTime,
                endTime: null
            });
        }

        async function handlePomoSwitchMode(newMode) {
            // This is only called if validation passes (timer is idle/reset)
            const newTime = (newMode === 'focus' ? pomoState.config.focus : pomoState.config.break) * 60;
            await updatePomoDoc({
                status: 'idle',
                mode: newMode,
                remaining: newTime,
                totalDuration: newTime,
                endTime: null
            });
        }

        // 6. UI Renderer & Local Tick
        function renderPomoUI() {
            // Update Tabs UI
            if (pomoState.mode === 'focus') {
                pomoBtnFocus.classList.add('active');
                pomoBtnBreak.classList.remove('active');
            } else {
                pomoBtnBreak.classList.add('active');
                pomoBtnFocus.classList.remove('active');
            }

            if (pomoLocalInterval) clearInterval(pomoLocalInterval);

            if (pomoState.status === 'running') {
                pomoStartBtn.innerHTML = `<i class="fas fa-pause mr-1"></i> Pause`;
                pomoStartBtn.classList.replace('bg-emerald-500', 'bg-amber-500');

                pomoLocalInterval = setInterval(() => {
                    const now = Date.now();
                    const distance = pomoState.endTime - now;
                    const secondsLeft = Math.ceil(distance / 1000);

                    if (secondsLeft <= 0) {
                        handleTimerComplete(); 
                    } else {
                        updateDisplayElements(secondsLeft, pomoState.totalDuration);
                    }
                }, 200); 

            } else {
                pomoStartBtn.innerHTML = `<i class="fas fa-play mr-1"></i> ${pomoState.status === 'paused' ? 'Resume' : 'Start'}`;
                pomoStartBtn.classList.replace('bg-amber-500', 'bg-emerald-500');
                
                updateDisplayElements(pomoState.remaining, pomoState.totalDuration);
                
                document.title = 'Class Caddy - My Study Plan';
                pomoIconTime.classList.add('hidden');
            }
        }

        function updateDisplayElements(secondsLeft, totalDuration) {
            const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
            const s = (secondsLeft % 60).toString().padStart(2, '0');
            const timeStr = `${m}:${s}`;

            pomoTimerDisplay.textContent = timeStr;
            
            const percent = ((totalDuration - secondsLeft) / totalDuration) * 100;
            pomoProgressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;

            if (pomoState.status === 'running') {
                document.title = `(${timeStr}) Class Caddy`;
                pomoIconTime.textContent = timeStr;
                pomoIconTime.classList.remove('hidden');
            }
        }

        function handleTimerComplete() {
            clearInterval(pomoLocalInterval);
            
            // --- SOUND FIX ---
            pomoAlarm.play().catch(e => console.log("Audio play failed:", e));
            
            const msg = pomoState.mode === 'focus' ? "Focus complete! Take a break." : "Break over! Back to work.";
            showCustomAlert(msg, "success");

            // Auto-switch Logic (Resetting timer for next phase)
            const nextMode = pomoState.mode === 'focus' ? 'break' : 'focus';
            const nextDuration = (nextMode === 'focus' ? pomoState.config.focus : pomoState.config.break) * 60;

            // We update DB so all devices see it ended
            updatePomoDoc({
                status: 'idle',
                mode: nextMode,
                remaining: nextDuration,
                totalDuration: nextDuration,
                endTime: null
            });
        }

        if (document.getElementById('pomodoro-widget')) {
            initPomodoro();
        }
        // --- END: POMODORO TIMER LOGIC ---
		
// --- BACKUP & RESTORE MANAGER (CLOUD & LOCAL) ---

const backupModal = document.getElementById('backup-restore-modal');
const tabBackup = document.getElementById('tab-btn-backup');
const tabRestore = document.getElementById('tab-btn-restore');
const contentBackup = document.getElementById('content-backup');
const contentRestore = document.getElementById('content-restore');

// Buttons
const backupDownloadBtn = document.getElementById('backup-download-btn');
const backupCloudBtn = document.getElementById('backup-cloud-btn');
const performRestoreFileBtn = document.getElementById('perform-restore-file-btn');
const refreshCloudListBtn = document.getElementById('refresh-cloud-backups-btn');
const restoreFileInput = document.getElementById('restore-file-input');
const cloudBackupList = document.getElementById('cloud-backup-list');
const lastBackupText = document.getElementById('last-backup-text');

// 1. Open Modal
document.getElementById('open-backup-modal-btn')?.addEventListener('click', () => {
    backupModal.style.display = 'block';
    updateLastBackupText();
});

function updateLastBackupText() {
    const lastDate = localStorage.getItem('cc_last_backup_date');
    if (lastDate) {
        const date = new Date(parseInt(lastDate));
        lastBackupText.textContent = `Last local backup: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else {
        lastBackupText.textContent = "Last backup: Never";
    }
}

// 2. Tab Switching
tabBackup.addEventListener('click', () => {
    tabBackup.classList.add('active-tab-br');
    tabRestore.classList.remove('active-tab-br');
    contentBackup.classList.remove('hidden');
    contentRestore.classList.add('hidden');
});

tabRestore.addEventListener('click', () => {
    tabRestore.classList.add('active-tab-br');
    tabBackup.classList.remove('active-tab-br');
    contentRestore.classList.remove('hidden');
    contentBackup.classList.add('hidden');
    
    // Load cloud backups when tab opens
    loadCloudBackups();
});

refreshCloudListBtn.addEventListener('click', loadCloudBackups);

// --- HELPER: Generate Backup Data Object (With Progress Tracking) ---
async function generateBackupObject(onProgress = () => {}) {
    const userId = auth.currentUser.uid;
    const appId = "study-plan17";
    const plansCollectionPath = `artifacts/${appId}/users/${userId}/studyPlans`;
    
    const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
    const querySnapshot = await getDocs(q);
    
    const totalMonths = querySnapshot.size;
    const backupData = {};
    
    if (totalMonths === 0) {
        onProgress(100);
        return backupData;
    }

    let processedCount = 0;

    for (const docSnap of querySnapshot.docs) {
        const monthId = docSnap.id;
        const monthData = docSnap.data();
        
        const weeksCollectionRef = collection(db, docSnap.ref.path, 'weeks');
        const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
        
        const weeksData = {};
        weeksQuerySnapshot.forEach(weekDoc => {
            weeksData[weekDoc.id] = weekDoc.data();
        });

        backupData[monthId] = {
            ...monthData,
            weeks: weeksData 
        };

        // Update Progress
        processedCount++;
        const percent = Math.round((processedCount / totalMonths) * 100);
        onProgress(percent);
    }
    return backupData;
}

// 3. ACTION: Download JSON File
backupDownloadBtn.addEventListener('click', async () => {
    if (!auth.currentUser) return;

    const originalText = backupDownloadBtn.innerHTML;
    backupDownloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> 0%`; // Show text progress in button
    backupDownloadBtn.disabled = true;;

    try {
        const backupData = await generateBackupObject();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "class_caddy_backup_" + new Date().toISOString().slice(0, 10) + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        localStorage.setItem('cc_last_backup_date', Date.now());
        updateLastBackupText();
        showCustomAlert("Backup downloaded successfully!", "success");

    } catch (error) {
        console.error("Export failed:", error);
        showCustomAlert("Export failed. Check console.", "error");
    } finally {
        backupDownloadBtn.innerHTML = originalText;
        backupDownloadBtn.disabled = false;
    }
});

// 4. SHARED FUNCTION: Perform Cloud Backup (With Progress Bar)
async function executeCloudBackup(isAuto = false) {
    if (!auth.currentUser) return;

    const btn = document.getElementById('backup-cloud-btn');
    
    // UI Elements for Progress
    const progressUI = document.getElementById('backup-progress-ui');
    const progressBar = document.getElementById('backup-progress-bar');
    const stepText = document.getElementById('backup-step-text');
    const percentText = document.getElementById('backup-percent-text');

    let originalText = "";
    
    // Helper to update the bar
    const updateProgress = (percent, message) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}%`;
        if (stepText && message) stepText.textContent = message;
    };

    if (!isAuto && btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Processing...`;
        btn.disabled = true;
        
        // Show Progress Bar
        if (progressUI) {
            progressUI.classList.remove('hidden');
            updateProgress(0, "Starting...");
        }
    } else if (isAuto) {
        console.log("Triggering Cloud-Sync Auto Backup...");
    }

    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const cloudBackupsRef = collection(db, `artifacts/${appId}/users/${userId}/cloudBackups`);

        // --- STEP 1: ENFORCE LIMIT (Quick check) ---
        if (!isAuto) updateProgress(5, "Checking storage...");
        
        const q = query(cloudBackupsRef, orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);

        let successMessage = isAuto ? "Daily Auto-Backup Complete!" : "Backup saved to cloud successfully!";

        if (snapshot.size >= 10) { 
            if (!isAuto) updateProgress(10, "Cleaning old backups...");
            
            // We want to keep 9 old ones + 1 new one = 10 total.
            // So we delete (Total - 9).
            const numToDelete = snapshot.size - 9; 
            const batch = writeBatch(db);

            for (let i = 0; i < numToDelete; i++) {
                const oldDoc = snapshot.docs[i];
                if (oldDoc.data().isChunked) {
                    const partsRef = collection(db, oldDoc.ref.path, 'parts');
                    const partsSnap = await getDocs(partsRef);
                    partsSnap.forEach(part => batch.delete(part.ref));
                }
                batch.delete(oldDoc.ref);
            }
            await batch.commit();
            
            if (isAuto) successMessage = "Daily Auto-Backup Complete! (Oldest removed)";
            else successMessage = "Backup saved! (Oldest backup removed to maintain limit)";
        }

        // --- STEP 2: GENERATE DATA (Reading takes the most time) ---
        // We map the generation progress (0-100) to the bar's (10-80) range
        
        const backupData = await generateBackupObject((genPercent) => {
            if (!isAuto) {
                // Scale 0-100 to 15-80
                const visualPercent = 15 + Math.round(genPercent * 0.65);
                updateProgress(visualPercent, `Gathering Data (${genPercent}%)`);
            }
        });

        const jsonString = JSON.stringify(backupData);
        const CHUNK_SIZE = 200000; 
        const noteText = isAuto ? "Auto-Backup (24h Cycle)" : "Manual Cloud Backup";

        // --- STEP 3: UPLOAD (Writing is fast, but we track it) ---
        if (!isAuto) updateProgress(85, "Uploading...");

        if (jsonString.length > CHUNK_SIZE) {
            // Large File (Chunked)
            const chunks = [];
            for (let i = 0; i < jsonString.length; i += CHUNK_SIZE) {
                chunks.push(jsonString.substring(i, i + CHUNK_SIZE));
            }

            if (!isAuto) updateProgress(90, `Uploading ${chunks.length} parts...`);

            const backupDocRef = await addDoc(cloudBackupsRef, {
                timestamp: Timestamp.now(),
                note: noteText,
                isChunked: true,
                chunkCount: chunks.length,
                totalSize: jsonString.length
            });

            const batch = writeBatch(db);
            chunks.forEach((chunk, index) => {
                const chunkRef = doc(db, backupDocRef.path, 'parts', index.toString());
                batch.set(chunkRef, { data: chunk, index: index });
            });
            await batch.commit();

        } else {
            // Small File
            if (!isAuto) updateProgress(90, "Uploading...");
            await addDoc(cloudBackupsRef, {
                timestamp: Timestamp.now(),
                note: noteText,
                isChunked: false,
                data: jsonString
            });
        }

        // Finish
        if (!isAuto) updateProgress(100, "Complete!");
        
        // Tiny delay so user sees 100% before closing
        setTimeout(() => {
            localStorage.setItem('cc_last_cloud_backup_timestamp', Date.now());
            showCustomAlert(successMessage, "success");
            
            if (document.getElementById('backup-restore-modal').style.display === 'block') {
                document.getElementById('tab-btn-restore').click();
            }
            
            // Reset UI
            if (progressUI) progressUI.classList.add('hidden');
            if (!isAuto && btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 600);

    } catch (error) {
        console.error("Cloud backup failed:", error);
        if (!isAuto) {
            updateProgress(0, "Failed");
            showCustomAlert("Cloud backup failed.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// Listener for Manual Click
backupCloudBtn.addEventListener('click', () => executeCloudBackup(false));


// --- 5. SMART SCHEDULER (UNIVERSAL 24-HOUR CYCLE) ---

async function initSmartCloudBackup() {
    const checkAndRun = async () => {
        if (!auth.currentUser) return;

        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const cloudBackupsRef = collection(db, `artifacts/${appId}/users/${userId}/cloudBackups`);

        try {
            // Query the NEWEST backup (Ordered by timestamp DESCending)
            const q = query(cloudBackupsRef, orderBy("timestamp", "desc")); 
            const snapshot = await getDocs(q);

            let shouldBackup = false;

            if (snapshot.empty) {
                console.log("No cloud backups found. Initializing first auto-backup.");
                shouldBackup = true;
            } else {
                const lastDoc = snapshot.docs[0]; 
                const lastBackupDate = lastDoc.data().timestamp.toDate();
                const lastBackupTime = lastBackupDate.getTime();
                const now = Date.now();
                
                // --- CHANGED TO 6 HOURS ---
                const SIX_HOURS = 6 * 60 * 60 * 1000; 

                if ((now - lastBackupTime) > SIX_HOURS) {
                    console.log(`Last backup was ${lastBackupDate.toLocaleString()}. >6h ago. Triggering backup.`);
                    shouldBackup = true;
                }
            }

            if (shouldBackup) {
                executeCloudBackup(true); // Run Auto Backup
            }

        } catch (error) {
            console.error("Error checking backup status:", error);
        }
    };

    // 1. Check 5 seconds after load
    setTimeout(checkAndRun, 5000);

    // 2. Check every 20 minutes
    setInterval(checkAndRun, 20 * 60 * 1000);
}


// Hook into Auth State so it starts when user logs in
onAuthStateChanged(auth, (user) => {
    if (user) {
        initSmartCloudBackup();
    }
});

// --- 6. LOAD CLOUD BACKUPS (THE MISSING FUNCTION) ---
async function loadCloudBackups() {
    if (!auth.currentUser) return;
    
    cloudBackupList.innerHTML = '<p class="text-center text-gray-400 text-xs py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Loading...</p>';
    
    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const cloudBackupsRef = collection(db, `artifacts/${appId}/users/${userId}/cloudBackups`);
        
        // Order by newest first
        const q = query(cloudBackupsRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            cloudBackupList.innerHTML = '<p class="text-center text-gray-400 text-xs py-4">No cloud backups found.</p>';
            return;
        }
        
        let html = '';
        querySnapshot.forEach(doc => {
            const backup = doc.data();
            const date = backup.timestamp ? backup.timestamp.toDate() : new Date();
            const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            
            // Note handling
            const note = backup.note || "Manual Cloud Backup";
            
            html += `
            <div class="cloud-backup-card">
                <div>
                    <span class="backup-info-title"><i class="fas fa-clock text-gray-400 mr-1"></i> ${dateStr}</span>
                    <span class="backup-info-date">${timeStr} - ${note}</span>
                </div>
                <div class="flex items-center">
                    <button class="restore-cloud-btn" onclick="restoreFromCloud('${doc.id}')">
                        Restore
                    </button>
                </div>
            </div>`;
        });
        
        cloudBackupList.innerHTML = html;

    } catch (error) {
        console.error("Error loading cloud backups:", error);
        cloudBackupList.innerHTML = '<p class="text-center text-red-400 text-xs py-4">Error loading backups.</p>';
    }
}

// 7. ACTION: Restore From Cloud (The "Restore" button on card)
window.restoreFromCloud = async function(docId) {
    if (!confirm("WARNING: Restoring this backup will OVERWRITE your current study plan.\n\nAre you sure you want to proceed?")) {
        return;
    }
    
    showCustomAlert("Fetching backup...", "success");
    
    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/cloudBackups`, docId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            showCustomAlert("Backup file not found.", "error");
            return;
        }
        
        const docData = docSnap.data();
        let finalJsonString = "";

        // --- CHECK FOR CHUNKS ---
        if (docData.isChunked) {
            console.log(`Detected chunked backup (${docData.chunkCount} parts). Reassembling...`);
            
            // Fetch all parts from subcollection
            const partsRef = collection(db, docRef.path, 'parts');
            const partsSnap = await getDocs(partsRef);
            
            // Sort by index to ensure correct order
            const parts = [];
            partsSnap.forEach(partDoc => {
                parts.push(partDoc.data());
            });
            parts.sort((a, b) => a.index - b.index);
            
            // Join them
            finalJsonString = parts.map(p => p.data).join('');
            
        } else {
            // Normal simple backup
            finalJsonString = docData.data;
        }
        
        const backupData = JSON.parse(finalJsonString);
        
        // Use the shared executor logic
        await executeRestore(backupData);
        
    } catch (error) {
        console.error("Restore from cloud failed:", error);
        showCustomAlert("Failed to restore. Data might be corrupt.", "error");
    }
};

// 8. ACTION: Restore From File (Existing Logic)
performRestoreFileBtn.addEventListener('click', () => {
    restoreFileInput.click();
});

restoreFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("WARNING: This will OVERWRITE existing data.\n\nAre you sure?")) {
        restoreFileInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const jsonData = JSON.parse(event.target.result);
            await executeRestore(jsonData);
        } catch (e) {
            showCustomAlert("Invalid JSON file.", "error");
        } finally {
            restoreFileInput.value = '';
        }
    };
    reader.readAsText(file);
});

// --- SHARED RESTORE EXECUTOR ---
async function executeRestore(backupData) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;";
    loadingOverlay.innerHTML = `<i class="fas fa-spinner fa-spin text-4xl text-emerald-600 mb-4"></i><h3 class="text-xl font-bold text-gray-700">Restoring Data...</h3><p class="text-gray-500">Please wait, do not close the page.</p>`;
    document.body.appendChild(loadingOverlay);

    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const rootPath = `artifacts/${appId}/users/${userId}/studyPlans`;

        let totalMonths = 0;

        for (const monthId in backupData) {
            const fullMonthData = backupData[monthId];
            const weeksData = fullMonthData.weeks || {};
            delete fullMonthData.weeks;

            // Restore Month Doc
            const monthDocRef = doc(db, rootPath, monthId);
            await setDoc(monthDocRef, fullMonthData);

            // Restore Weeks
            for (const weekId in weeksData) {
                const weekDocRef = doc(db, rootPath, monthId, 'weeks', weekId);
                await setDoc(weekDocRef, weeksData[weekId]);
            }
            totalMonths++;
        }

        loadingOverlay.innerHTML = `<i class="fas fa-check-circle text-4xl text-emerald-600 mb-4"></i><h3 class="text-xl font-bold text-gray-700">Success!</h3>`;
        setTimeout(() => location.reload(), 1000);

    } catch (error) {
        console.error("Restore execution failed:", error);
        document.body.removeChild(loadingOverlay);
        showCustomAlert("Error restoring data.", "error");
    }
}
// --- END BACKUP MANAGER ---

// --- MASTER MCQ PRINT FUNCTIONALITY ---

// Helper to determine label type (Bangla vs English)
function getOptionLabel(index, text) {
    const banglaRegex = /[\u0980-\u09FF]/;
    const labelsBangla = ['ক', 'খ', 'গ', 'ঘ'];
    const labelsEnglish = ['a', 'b', 'c', 'd'];
    
    if (banglaRegex.test(text)) {
        return labelsBangla[index] || (index + 1);
    }
    return labelsEnglish[index] || (index + 1);
}

// 1. Build the HTML for Printing (GROUPED BY SUBJECT)
async function buildMasterMcqPrintHtml() {
    if (!auth.currentUser) return null;
    
    let html = '<div class="mcq-print-wrapper">';
    
    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const plansCollectionPath = `artifacts/${appId}/users/${userId}/studyPlans`;
        
        const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return "<p>No MCQs found.</p>";

        for (const docSnap of querySnapshot.docs) {
            const monthId = docSnap.id;
            const monthData = docSnap.data();
            const monthName = monthData.monthName || monthId;

            let monthHeaderAdded = false;

            const weeksCollectionRef = collection(db, docSnap.ref.path, 'weeks');
            const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
            
            const sortedWeeks = weeksQuerySnapshot.docs.sort((a, b) => a.id.localeCompare(b.id));

            for (const weekDoc of sortedWeeks) {
                const weekId = weekDoc.id;
                const weekData = weekDoc.data();
                if (!weekData.days) continue;

                for (const day of weekData.days) {
                    
                    // --- STEP 1: Group MCQs by Subject ---
                    const mcqsBySubject = {}; 
                    let hasMcqs = false;

                    day.rows?.forEach(row => {
                        if (row.mcqData && row.mcqData.length > 0) {
                            const subject = row.subject || "General";
                            if (!mcqsBySubject[subject]) {
                                mcqsBySubject[subject] = [];
                            }
                            mcqsBySubject[subject].push(...row.mcqData);
                            hasMcqs = true;
                        }
                    });

                    // --- STEP 2: Render ---
                    if (hasMcqs) {
                        if (!monthHeaderAdded) {
                            html += `<div class="print-month-header">${escapeHtml(monthName)}</div>`;
                            monthHeaderAdded = true;
                        }

                        // Start Day Group
                        html += `<div class="print-day-group">`;
                        html += `<div class="print-day-header">Week ${weekId.replace('week', '')} - Day ${day.dayNumber}</div>`;

                        // Loop through Subjects
                        for (const [subject, mcqs] of Object.entries(mcqsBySubject)) {
                            
                            // SUBJECT HEADER (Appears once per subject block)
                            html += `<div class="print-subject-header">${escapeHtml(subject)}</div>`;

                            // Loop through Questions for this Subject
                            mcqs.forEach((mcq, idx) => {
                                // Find correct answer label
                                const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
                                const ansLabel = (correctIndex !== -1) 
                                    ? getOptionLabel(correctIndex, mcq.question) 
                                    : '?';

                                html += `
                                    <div class="print-mcq-item">
                                        <div class="print-q-text">
                                            <span class="q-num">${idx + 1}.</span> ${escapeHtml(mcq.question)}
                                        </div>
                                        <div class="print-options-grid">
                                            ${mcq.options.map((opt, i) => {
                                                const label = getOptionLabel(i, mcq.question);
                                                return `<div><span class="opt-label">${label}.</span> ${escapeHtml(opt)}</div>`;
                                            }).join('')}
                                        </div>
                                        <div class="print-ans-key">
                                            Correct: <b>${ansLabel}</b>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        html += `</div>`; // End Day Group
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error building print HTML", e);
        return `<p>Error generating print layout.</p>`;
    }

    html += '</div>'; // End Wrapper
    return html;
}




// --- NEW MCQ STUDY CENTER LOGIC ---
const masterMcqMenuContent = document.getElementById('master-mcq-menu-content');
const mcqStudyModal = document.getElementById('mcq-study-modal');
const mcqStudyContent = document.getElementById('mcq-study-content');
const printStudyBtn = document.getElementById('print-study-mcq-btn');

// State to hold current view data for printing
let currentStudyViewData = null; 
let currentViewMcqData = null; // Stores data for the View Modal

// 1. Open the Menu
document.getElementById('show-master-mcq-btn').addEventListener('click', displayMcqMenu);

async function displayMcqMenu() {
    const masterMcqModal = document.getElementById('master-mcq-modal'); 
    
    if (!auth.currentUser) { showCustomAlert("Please log in."); return; }
    
    masterMcqModal.style.display = "block";
    masterMcqMenuContent.innerHTML = '<p class="text-center text-gray-500 py-10"><i class="fas fa-spinner fa-spin"></i> Loading Repository...</p>';

    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/studyPlans`), orderBy(documentId(), "asc"));
        const querySnapshot = await getDocs(q);

        let html = '';
        let totalLifetimeMcqs = 0;
        let monthsHtml = '';

        for (const docSnap of querySnapshot.docs) {
            const monthId = docSnap.id;
            const monthData = docSnap.data();
            const monthName = monthData.monthName || monthId;
            
            // Fetch Weeks
            const weeksRef = collection(db, docSnap.ref.path, 'weeks');
            const weeksSnap = await getDocs(weeksRef);
            const sortedWeeks = weeksSnap.docs.sort((a, b) => a.id.localeCompare(b.id));

            let monthMcqCount = 0;
            let weeksHtml = '';

            for (const weekDoc of sortedWeeks) {
                const weekId = weekDoc.id;
                const weekData = weekDoc.data();
                if (!weekData.days) continue;

                let weekMcqCount = 0;
                let daysHtml = '';

                weekData.days.forEach(day => {
                    const subjectCounts = {};
                    let dayTotal = 0;

                    day.rows?.forEach(row => {
                        if (row.mcqData && row.mcqData.length > 0) {
                            const sub = row.subject || 'General';
                            if (!subjectCounts[sub]) subjectCounts[sub] = 0;
                            subjectCounts[sub] += row.mcqData.length;
                            dayTotal += row.mcqData.length;
                        }
                    });

                    if (dayTotal > 0) {
                        weekMcqCount += dayTotal;
                        const subjectBtns = Object.entries(subjectCounts).map(([sub, count]) => {
                            // FIX: Use data attributes instead of onclick
                            return `<button class="btn-mcq-subject" data-action="open-study" data-scope="subject" data-month-id="${monthId}" data-week-id="${weekId}" data-day-num="${day.dayNumber}" data-subject="${escapeHtml(sub)}">
                                ${escapeHtml(sub)} (${count})
                            </button>`;
                        }).join('');

                        daysHtml += `
                            <div class="ml-4 mb-2 border-l-2 border-gray-200 pl-3">
                                <div class="text-xs font-bold text-gray-400 mb-1">Day ${day.dayNumber}</div>
                                <div class="flex flex-wrap">${subjectBtns}</div>
                            </div>
                        `;
                    }
                });

                if (weekMcqCount > 0) {
                    monthMcqCount += weekMcqCount;
                    weeksHtml += `
                        <div class="mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-indigo-600 uppercase tracking-wide">${weekId.replace('week', 'Week ')}</span>
                                <button class="btn-mcq-week" data-action="open-study" data-scope="week" data-month-id="${monthId}" data-week-id="${weekId}">
                                    Week Total (${weekMcqCount})
                                </button>
                            </div>
                            ${daysHtml}
                        </div>
                    `;
                }
            }

            if (monthMcqCount > 0) {
                totalLifetimeMcqs += monthMcqCount;
                monthsHtml += `
                    <div class="mcq-menu-section">
                        <div class="mcq-menu-header">
                            <span>${monthName}</span>
                            <button class="btn-mcq-month" style="width:auto; margin:0; padding:4px 10px; font-size:0.8rem;" data-action="open-study" data-scope="month" data-month-id="${monthId}">
                                Study Month (${monthMcqCount})
                            </button>
                        </div>
                        <div class="mcq-menu-body">
                            ${weeksHtml}
                        </div>
                    </div>
                `;
            }
        }

        if (totalLifetimeMcqs > 0) {
            html += `
                <button class="btn-mcq-all" data-action="open-study" data-scope="all">
                    <i class="fas fa-globe-asia mr-2"></i> Study All Lifetime MCQs (${totalLifetimeMcqs})
                </button>
            `;
        } else {
            html += `<p class="text-center text-gray-500">No MCQs found in your study plan.</p>`;
        }

        html += monthsHtml;
        masterMcqMenuContent.innerHTML = html;

    } catch (e) {
        console.error(e);
        masterMcqMenuContent.innerHTML = '<p class="text-red-500 text-center">Error loading menu.</p>';
    }
}

// --- NEW: Event Delegation for MCQ Repository ---
if (masterMcqMenuContent) {
    masterMcqMenuContent.addEventListener('click', (e) => {
        // Find the closest button with data-action="open-study"
        const btn = e.target.closest('[data-action="open-study"]');
        if (!btn) return;

        const ds = btn.dataset;
        
        // Convert dayNum to integer if it exists
        const dayNum = ds.dayNum ? parseInt(ds.dayNum) : null;
        
        // Call the study opener
        openMcqStudy(ds.scope, ds.monthId, ds.weekId, dayNum, ds.subject);
    });
}
// 2. Open Study Modal (Fetcher)
// 2. Open Study Modal (Fetcher)
window.openMcqStudy = async function(scope, monthId, weekId, dayNum, subject) {
    mcqStudyModal.style.display = 'block';
    mcqStudyContent.innerHTML = '<p class="text-center py-20"><i class="fas fa-spinner fa-spin text-4xl text-indigo-300"></i></p>';
    
    // Setup Header
    const titleEl = document.getElementById('study-modal-title');
    const subEl = document.getElementById('study-modal-subtitle');
    const printBtn = document.getElementById('print-study-mcq-btn');

    if (scope === 'all') {
        titleEl.textContent = "Lifetime MCQ Collection";
        subEl.textContent = "All Questions";
        printBtn.style.display = 'none'; // Disable print for ALL
    } else if (scope === 'month') {
        titleEl.textContent = `Month: ${monthId}`;
        subEl.textContent = "All questions for this month";
        printBtn.style.display = 'inline-flex';
    } else if (scope === 'week') {
        titleEl.textContent = `Week: ${weekId} (${monthId})`;
        subEl.textContent = "All questions for this week";
        printBtn.style.display = 'inline-flex';
    } else if (scope === 'subject') {
        titleEl.textContent = `${subject}`;
        subEl.textContent = `Day ${dayNum} - ${weekId} - ${monthId}`;
        printBtn.style.display = 'inline-flex';
    }

    // Fetch Logic
    try {
        const userId = auth.currentUser.uid;
        const appId = "study-plan17";
        const plansCollectionPath = `artifacts/${appId}/users/${userId}/studyPlans`;
        
        let q;
        if (scope === 'all') {
            q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
        } else {
            // For month/week/subject, we just start with the month
            q = query(collection(db, plansCollectionPath), where(documentId(), '==', monthId));
        }

        const querySnapshot = await getDocs(q);
        let finalMcqs = [];

        for (const docSnap of querySnapshot.docs) {
            const mId = docSnap.id;
            const weeksRef = collection(db, docSnap.ref.path, 'weeks');
            const weeksSnap = await getDocs(weeksRef);
            const sortedWeeks = weeksSnap.docs.sort((a, b) => a.id.localeCompare(b.id));

            for (const weekDoc of sortedWeeks) {
                const wId = weekDoc.id;
                if (scope === 'week' && wId !== weekId) continue;
                if (scope === 'subject' && wId !== weekId) continue;

                const weekData = weekDoc.data();
                if (!weekData.days) continue;

                weekData.days.forEach(day => {
                    if (scope === 'subject' && day.dayNumber !== dayNum) return;

                    day.rows?.forEach(row => {
                        if (row.mcqData && row.mcqData.length > 0) {
                            // FIX: Handle 'General' default if subject is empty
                            const rowSubject = row.subject || 'General';
                            if (scope === 'subject' && rowSubject !== subject) return;
                            
                            // Add Metadata to MCQ for display
                            row.mcqData.forEach(mcq => {
                                finalMcqs.push({
                                    ...mcq,
                                    meta: {
                                        day: day.dayNumber,
                                        week: wId,
                                        month: mId,
                                        subject: rowSubject
                                    }
                                });
                            });
                        }
                    });
                });
            }
        }

        currentStudyViewData = { scope, title: titleEl.textContent, mcqs: finalMcqs };
        renderStudyView(finalMcqs);

    } catch (e) {
        console.error(e);
        mcqStudyContent.innerHTML = '<p class="text-red-500">Error loading data.</p>';
    }
};

// 3. Render the Cards (UPDATED: With Resizable Explanation)
function renderStudyView(mcqs) {
    if (mcqs.length === 0) {
        mcqStudyContent.innerHTML = '<div class="text-center py-10 text-gray-500">No MCQs found here.</div>';
        return;
    }

    let html = '';
    mcqs.forEach((mcq, idx) => {
        const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
        const correctLabel = (correctIndex !== -1) ? getOptionLabel(correctIndex, mcq.question) : '?';
        
        // --- 1. Answer Box (Green/Yellow) ---
        let answerHtml = '';
        if (mcq.correctAnswer) {
             answerHtml = `
                <div class="inline-flex items-center w-full sm:w-auto bg-emerald-100 border border-emerald-300 rounded-lg px-4 py-2 shadow-sm answer-card-bg">
                    <div class="flex-shrink-0 bg-emerald-200 rounded-full p-1 mr-3 text-emerald-700 answer-icon-bg">
                        <i class="fas fa-check text-xs"></i>
                    </div>
                    <div class="font-semibold text-emerald-900 text-sm answer-text">
                        Correct: <span class="text-emerald-800 answer-label">${correctLabel}. ${escapeHtml(mcq.correctAnswer)}</span>
                    </div>
                </div>`;
        } else {
             // Added 'answer-text' class here so it resizes too
             answerHtml = `
                <div class="inline-flex items-center w-full sm:w-auto bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 shadow-sm">
                    <div class="flex-shrink-0 bg-amber-200 rounded-full p-1 mr-3 text-amber-700"><i class="fas fa-exclamation text-xs"></i></div>
                    <div class="font-semibold text-amber-900 text-sm answer-text">Note: <span class="text-amber-800">${escapeHtml(mcq.explanation || "No Answer Defined")}</span></div>
                </div>`;
        }

        // --- 2. Note/Explanation Box (Blue) ---
        let noteHtml = '';
        if (mcq.note) {
            // Added 'explanation-text' class here
            noteHtml = `
                <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 explanation-text">
                    <span class="font-bold"><i class="fas fa-info-circle mr-1"></i> Explanation:</span> ${escapeHtml(mcq.note)}
                </div>
            `;
        }

        html += `
            <div class="study-card">
                <div class="study-question text-gray-900 font-medium">
                    <span class="text-indigo-600 font-bold mr-1">${idx + 1}.</span>${escapeHtml(mcq.question)}
                </div>
                
                <div class="study-options">
                    ${mcq.options.map((opt, i) => `
                        <div class="study-opt text-gray-900">
                            <span class="font-bold text-black mr-2">${getOptionLabel(i, mcq.question)}.</span>
                            ${escapeHtml(opt)}
                        </div>
                    `).join('')}
                </div>

                <div class="mt-4 pt-2 border-t border-dashed border-gray-200">
                    ${answerHtml}
                    ${noteHtml}
                </div>
            </div>
        `;
    });
    mcqStudyContent.innerHTML = html;
    
    // Apply current settings immediately
    applySettingsToDom();
}

	// 5. NEW: Test Handler for Study View (UPDATED: Exits Fullscreen)
document.getElementById('test-study-mcq-btn').addEventListener('click', () => {
    if (!currentStudyViewData || currentStudyViewData.mcqs.length === 0) {
        showCustomAlert("No MCQs available to test.", "error");
        return;
    }

    // --- FIX: Exit Fullscreen if active so Quiz Modal appears on top ---
    if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }

    // 2. Prepare data for the quiz function
    const mcqData = currentStudyViewData.mcqs;
    const title = currentStudyViewData.title;

    // 3. Set Global Quiz State
    currentMcqTarget = { 
        quizType: 'aggregated', 
        description: title 
    };
    
    window.currentQuizSubjectInfo = { 
        subjectName: "Study Mode", 
        topicDetail: title 
    };

    // 4. Initialize Quiz UI
    quizTitle.textContent = 'MCQ Quiz';
    
    // --- START: FIX FOR OVERLAPPING SCREENS ---
    quizModal.style.display = "block";
    
    // Force hide Main, Results, and Review screens
    quizMainScreen.classList.add('hidden');
    quizMainScreen.style.display = 'none';
    
    quizResultsScreen.classList.add('hidden');
    quizResultsScreen.style.display = 'none'; // Critical fix
    
    quizReviewScreen.classList.add('hidden');
    quizReviewScreen.style.display = 'none';

    // Show Start Screen
    quizStartScreen.classList.remove('hidden');
    quizStartScreen.style.display = '';
    // --- END: FIX FOR OVERLAPPING SCREENS ---
    
    // 5. Prepare Questions
    currentMcqData = mcqData;
    currentVocabData = null;
    
    currentQuizQuestions = currentMcqData.map(mcq => ({ 
        question: mcq.question,
        options: [...mcq.options],
        correctAnswer: mcq.correctAnswer,
		explanation: mcq.explanation || null,
		note: mcq.note || null,
        userAnswer: null,
        isCorrect: null
    }));

    // 6. Calculate Time
    const totalQuestions = currentQuizQuestions.length;
    const totalTimeInSeconds = totalQuestions * 40;

    // 7. Update Start Screen Text
    const warningP = document.getElementById('quiz-total-time-warning');
    warningP.querySelector('span').textContent = formatTime(totalTimeInSeconds);
    warningP.style.display = 'block';
    
    quizStartMessage.textContent = `Ready to test yourself on ${totalQuestions} MCQs from: ${title}?`;
    
    // 8. Attach Start Button
    quizStartBtn.classList.remove('hidden');
    const newStartBtn = quizStartBtn.cloneNode(true);
    quizStartBtn.parentNode.replaceChild(newStartBtn, quizStartBtn);
    newStartBtn.addEventListener('click', runQuizGame);
    quizStartBtn = newStartBtn;
});


// 4. Print Handler (Uses 'currentStudyViewData')
printStudyBtn.addEventListener('click', () => {
    if (!currentStudyViewData || currentStudyViewData.mcqs.length === 0) return;
    
    // Re-use the logic from the previous robust print function, but adapt data source
    // We create a temporary virtual structure to feed the print function
    
    const printWindow = window.open('', '', 'height=900,width=1200');
    
    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Kalpurush:wght@400;700&display=swap');
            @page { size: A4; margin: 1cm; }
            body { font-family: 'Inter', 'Kalpurush', sans-serif; color: #1f2937; font-size: 11px; line-height: 1.3; }
            .mcq-print-wrapper { column-count: 2; column-gap: 2rem; column-rule: 1px solid #eee; }
            .print-header { column-span: all; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .print-mcq-item { break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; margin-bottom: 8px; background: #fff; }
            .print-q-text { font-weight: 600; margin-bottom: 6px; }
            .q-num { color: #059669; margin-right: 4px; }
            .print-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: #4b5563; }
            .print-ans-key { text-align: right; margin-top: 6px; font-size: 10px; color: #059669; border-top: 1px dashed #f3f4f6; padding-top: 2px; }
        </style>
    `;

    printWindow.document.write('<html><head><title>Study Print</title>' + styles + '</head><body>');
    printWindow.document.write(`
        <div class="print-header">
            <h1 style="margin:0; font-size:20px;">${currentStudyViewData.title}</h1>
            <p style="margin:5px 0; font-size:10px; color:#666;">Total Questions: ${currentStudyViewData.mcqs.length}</p>
        </div>
        <div class="mcq-print-wrapper">
    `);

    // Render Items
    currentStudyViewData.mcqs.forEach((mcq, idx) => {
        const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
        const ansLabel = (correctIndex !== -1) ? getOptionLabel(correctIndex, mcq.question) : '?';
        
        printWindow.document.write(`
            <div class="print-mcq-item">
                <div class="print-q-text">
                    <span class="q-num">${idx + 1}.</span> ${escapeHtml(mcq.question)}
                </div>
                <div class="print-options-grid">
                    ${mcq.options.map((opt, i) => `<div><b>${getOptionLabel(i, mcq.question)}.</b> ${escapeHtml(opt)}</div>`).join('')}
                </div>
                <div class="print-ans-key">Correct: <b>${ansLabel}</b></div>
            </div>
        `);
    });

    printWindow.document.write('</div></body></html>');
    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 1000);
});

// --- NEW: MCQ Full Screen Toggle Logic ---
const mcqFullscreenBtn = document.getElementById('mcq-fullscreen-btn');
const mcqStudyModalContent = document.querySelector('#mcq-study-modal .modal-content');

if (mcqFullscreenBtn && mcqStudyModalContent) {
    mcqFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // Enter Fullscreen
            if (mcqStudyModalContent.requestFullscreen) {
                mcqStudyModalContent.requestFullscreen();
            } else if (mcqStudyModalContent.webkitRequestFullscreen) { /* Safari */
                mcqStudyModalContent.webkitRequestFullscreen();
            } else if (mcqStudyModalContent.msRequestFullscreen) { /* IE11 */
                mcqStudyModalContent.msRequestFullscreen();
            }
        } else {
            // Exit Fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    });

    // Listen for fullscreen change events to update the icon
    const updateFullscreenIcon = () => {
        const icon = mcqFullscreenBtn.querySelector('i');
        if (document.fullscreenElement) {
            // We are in fullscreen: show "Compress" icon
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
            mcqFullscreenBtn.title = "Exit Fullscreen";
            mcqFullscreenBtn.classList.add('text-indigo-600'); // Highlight active state
        } else {
            // We are normal: show "Expand" icon
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
            mcqFullscreenBtn.title = "Enter Fullscreen";
            mcqFullscreenBtn.classList.remove('text-indigo-600');
        }
    };

    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('msfullscreenchange', updateFullscreenIcon);
}

// --- VIEW MCQ MODAL BUTTON LISTENERS ---

// 1. Test Button (View MCQ Modal) - (UPDATED: Uses Correct Subject)
const viewMcqTestBtn = document.getElementById('view-mcq-test-btn');
if (viewMcqTestBtn) {
    viewMcqTestBtn.addEventListener('click', () => {
        if (!currentViewMcqData || !currentViewMcqData.mcqs.length) {
            showCustomAlert("No MCQs to test.", "error");
            return;
        }
        
        // Fix: Exit Fullscreen if active so Quiz Modal appears on top
        if (document.fullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
        
        // Start Quiz with the data we just loaded
        const mcqData = currentViewMcqData.mcqs;
        const title = currentViewMcqData.title;
        
        // Set Quiz Context
        currentMcqTarget = { quizType: 'aggregated', description: title };
        
        // --- FIX: Use the actual subject we captured ---
        window.currentQuizSubjectInfo = { 
            subjectName: currentViewMcqData.subject || "Quick Test", 
            topicDetail: title 
        };
        
        // Init Quiz (Standard Force Hide Logic)
        quizTitle.textContent = 'MCQ Quiz';
        quizModal.style.display = "block";
        
        quizMainScreen.classList.add('hidden');
        quizMainScreen.style.display = 'none';
        
        quizResultsScreen.classList.add('hidden');
        quizResultsScreen.style.display = 'none';
        
        quizReviewScreen.classList.add('hidden');
        quizReviewScreen.style.display = 'none';

        quizStartScreen.classList.remove('hidden');
        quizStartScreen.style.display = '';
        
        currentMcqData = mcqData;
        currentVocabData = null;
        currentQuizQuestions = currentMcqData.map(mcq => ({ 
            question: mcq.question, options: [...mcq.options], correctAnswer: mcq.correctAnswer, explanation: mcq.explanation || null, note: mcq.note || null, userAnswer: null, isCorrect: null 
        }));
        
        const totalTime = currentQuizQuestions.length * 40;
        const warningP = document.getElementById('quiz-total-time-warning');
        warningP.querySelector('span').textContent = formatTime(totalTime);
        warningP.style.display = 'block';
        
        quizStartMessage.textContent = `Ready to test yourself on ${currentQuizQuestions.length} MCQs?`;
        quizStartBtn.classList.remove('hidden');
        
        const newStartBtn = quizStartBtn.cloneNode(true);
        quizStartBtn.parentNode.replaceChild(newStartBtn, quizStartBtn);
        newStartBtn.addEventListener('click', runQuizGame);
        quizStartBtn = newStartBtn;
    });
}


// 2. Print Button
const viewMcqPrintBtn = document.getElementById('view-mcq-print-btn');
if (viewMcqPrintBtn) {
    viewMcqPrintBtn.addEventListener('click', () => {
        if (!currentViewMcqData || !currentViewMcqData.mcqs.length) return;
        
        const printWindow = window.open('', '', 'height=900,width=1200');
        const styles = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Kalpurush:wght@400;700&display=swap');
                @page { size: A4; margin: 1cm; }
                body { font-family: 'Inter', 'Kalpurush', sans-serif; color: #1f2937; font-size: 11px; line-height: 1.3; }
                .mcq-print-wrapper { column-count: 2; column-gap: 2rem; column-rule: 1px solid #eee; }
                .print-header { column-span: all; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                .print-mcq-item { break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; margin-bottom: 8px; background: #fff; }
                .print-q-text { font-weight: 600; margin-bottom: 6px; }
                .q-num { color: #059669; margin-right: 4px; }
                .print-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: #4b5563; }
                .print-ans-key { text-align: right; margin-top: 6px; font-size: 10px; color: #059669; border-top: 1px dashed #f3f4f6; padding-top: 2px; }
            </style>`;

        printWindow.document.write('<html><head><title>Print View</title>' + styles + '</head><body>');
        printWindow.document.write(`
            <div class="print-header">
                <h1 style="margin:0; font-size:20px;">${currentViewMcqData.title}</h1>
                <p style="margin:5px 0; font-size:10px; color:#666;">Total Questions: ${currentViewMcqData.mcqs.length}</p>
            </div>
            <div class="mcq-print-wrapper">
        `);

        currentViewMcqData.mcqs.forEach((mcq, idx) => {
            const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
            const ansLabel = (correctIndex !== -1) ? getOptionLabel(correctIndex, mcq.question) : '?';
            
            printWindow.document.write(`
                <div class="print-mcq-item">
                    <div class="print-q-text"><span class="q-num">${idx + 1}.</span> ${escapeHtml(mcq.question)}</div>
                    <div class="print-options-grid">
                        ${mcq.options.map((opt, i) => `<div><b>${getOptionLabel(i, mcq.question)}.</b> ${escapeHtml(opt)}</div>`).join('')}
                    </div>
                    <div class="print-ans-key">Correct: <b>${ansLabel}</b></div>
                </div>
            `);
        });

        printWindow.document.write('</div></body></html>');
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
    });
}

// 3. Full Screen Button
const viewMcqFullscreenBtn = document.getElementById('view-mcq-fullscreen-btn');
const viewMcqModalContent = document.querySelector('#view-mcq-modal .modal-content');

if (viewMcqFullscreenBtn && viewMcqModalContent) {
    viewMcqFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            if (viewMcqModalContent.requestFullscreen) viewMcqModalContent.requestFullscreen();
            else if (viewMcqModalContent.webkitRequestFullscreen) viewMcqModalContent.webkitRequestFullscreen();
            else if (viewMcqModalContent.msRequestFullscreen) viewMcqModalContent.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    });

    const updateViewFullscreenIcon = () => {
        const icon = viewMcqFullscreenBtn.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.remove('fa-expand'); icon.classList.add('fa-compress');
            viewMcqFullscreenBtn.title = "Exit Fullscreen";
            viewMcqFullscreenBtn.classList.add('text-indigo-600');
        } else {
            icon.classList.remove('fa-compress'); icon.classList.add('fa-expand');
            viewMcqFullscreenBtn.title = "Enter Fullscreen";
            viewMcqFullscreenBtn.classList.remove('text-indigo-600');
        }
    };
    document.addEventListener('fullscreenchange', updateViewFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateViewFullscreenIcon);
    document.addEventListener('msfullscreenchange', updateViewFullscreenIcon);
}

// --- START: SETTINGS (DARK MODE & FONT SIZE) LOGIC ---

// --- START: GLOBAL SETTINGS SYNC & MODAL CONTROLS ---

// 1. Global State
let globalSettings = {
    darkMode: false,
    fontSize: 16
};

// 2. Sync with Firebase on Login
function initSettingsSync(userId) {
    const settingsRef = doc(db, `artifacts/${appId}/users/${userId}/settings`, 'preferences');
    onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.darkMode !== undefined) globalSettings.darkMode = data.darkMode;
            if (data.fontSize !== undefined) globalSettings.fontSize = data.fontSize;
            applySettingsToDom();
        } else {
            setDoc(settingsRef, globalSettings, { merge: true });
        }
    });
}

// 3. Apply Settings to Screen
function applySettingsToDom() {
    // Dark Mode
    if (globalSettings.darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');

    // Font Size (Apply to Study & View modals)
    ['mcq-study-content', 'view-mcq-content'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Base container font
            el.style.fontSize = `${globalSettings.fontSize}px`;
            
            // Question
            el.querySelectorAll('.study-question').forEach(q => q.style.fontSize = `${globalSettings.fontSize}px`);
            
            // Options
            el.querySelectorAll('.study-opt').forEach(o => o.style.fontSize = `${globalSettings.fontSize * 0.95}px`);
            
            // Answers (Correct/Note)
            el.querySelectorAll('.answer-text').forEach(a => a.style.fontSize = `${globalSettings.fontSize * 0.9}px`);
            
            // --- NEW: Explanation Text ---
            el.querySelectorAll('.explanation-text').forEach(e => e.style.fontSize = `${globalSettings.fontSize * 0.9}px`);
        }
    });

    // Update Input Boxes
    document.querySelectorAll('#mcq-font-input, #view-mcq-font-input').forEach(inp => inp.value = globalSettings.fontSize);
}


// 4. Save Settings
async function saveUserPreferences() {
    if (!auth.currentUser) return;
    const settingsRef = doc(db, `artifacts/${appId}/users/${auth.currentUser.uid}/settings`, 'preferences');
    setDoc(settingsRef, globalSettings, { merge: true }).catch(e => console.error("Settings save error:", e));
}

// 5. Global Dark Mode Button Listener
const globalDarkBtn = document.getElementById('global-dark-mode-btn');
if (globalDarkBtn) {
    globalDarkBtn.addEventListener('click', () => {
        globalSettings.darkMode = !globalSettings.darkMode;
        applySettingsToDom();
        saveUserPreferences();
    });
}

// 6. Modal Settings Listeners (Settings Button + Font Size)
function attachSettingsListeners(ids) {
    const settingsBtn = document.getElementById(ids.btn);
    const panel = document.getElementById(ids.panel);
    const fontInc = document.getElementById(ids.fontInc);
    const fontDec = document.getElementById(ids.fontDec);
    const fontInput = document.getElementById(ids.fontInput);

    if (!settingsBtn || !panel) return;

    // Open/Close Panel (UPDATED: Using addEventListener)
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (panel.classList.contains('active') && !panel.contains(e.target) && e.target !== settingsBtn) {
            panel.classList.remove('active');
        }
    });

    // Font Size Logic
    const changeFont = (newSize) => {
        if (newSize >= 10 && newSize <= 30) {
            globalSettings.fontSize = newSize;
            applySettingsToDom();
            saveUserPreferences();
        }
    };

    if (fontInc) fontInc.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        changeFont(globalSettings.fontSize + 1); 
    });
    
    if (fontDec) fontDec.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        changeFont(globalSettings.fontSize - 1); 
    });
    
    if (fontInput) fontInput.addEventListener('change', (e) => {
        changeFont(parseInt(e.target.value));
    });
}

// Initialize Listeners
attachSettingsListeners({ btn: 'mcq-settings-btn', panel: 'mcq-settings-panel', fontInc: 'mcq-font-inc', fontDec: 'mcq-font-dec', fontInput: 'mcq-font-input' });
attachSettingsListeners({ btn: 'view-mcq-settings-btn', panel: 'view-mcq-settings-panel', fontInc: 'view-mcq-font-inc', fontDec: 'view-mcq-font-dec', fontInput: 'view-mcq-font-input' });

// --- END: GLOBAL SETTINGS SYNC & MODAL CONTROLS ---

// --- BCS EXAM COUNTDOWN TIMER ---
// PASTE AT THE BOTTOM OF app.js

(function createCountdownWidget() {
    // 1. Create the HTML Element
    const countdownBtn = document.createElement('div');
    countdownBtn.id = 'bcs-countdown-btn';
    countdownBtn.className = 'floating-countdown-pill';
    countdownBtn.innerHTML = `
        <div class="countdown-icon"><i class="fas fa-hourglass-half"></i></div>
        <div class="countdown-text">
            <span class="countdown-label">BCS Prelim</span>
            <span id="bcs-timer-display" class="font-mono">00:00:00:00</span>
        </div>
    `;
    document.body.appendChild(countdownBtn);

    // 2. Countdown Logic
    const targetDate = new Date('January 30, 2026 00:00:00').getTime();
    const timerDisplay = document.getElementById('bcs-timer-display');

    function updateTimer() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            timerDisplay.textContent = "EXAM STARTED";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Format: dd:hh:mm:ss
        const d = days.toString().padStart(2, '0');
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const s = seconds.toString().padStart(2, '0');

        timerDisplay.textContent = `${d}:${h}:${m}:${s}`;
    }

    // 3. Start the Timer
    setInterval(updateTimer, 1000);
    updateTimer(); // Run once immediately
})();

// --- AUTOMATIC BODY SCROLL LOCK ---
// Prevents background scrolling when any modal is open

const scrollLockObserver = new MutationObserver(() => {
    let isAnyModalOpen = false;
    
    // Check every modal to see if any are visible
    document.querySelectorAll('.modal').forEach(modal => {
        const style = window.getComputedStyle(modal);
        if (style.display !== 'none') {
            isAnyModalOpen = true;
        }
    });
    
    // If any modal is open, freeze the body. Otherwise, unfreeze.
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : '';
});

// Start watching all modals for style/class changes
document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    if (modals.length > 0) {
        modals.forEach(modal => {
            scrollLockObserver.observe(modal, { 
                attributes: true, 
                attributeFilter: ['style', 'class'] 
            });
        });
    }
});

// Fallback: If DOM is already loaded (e.g. hot reload), attach immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.querySelectorAll('.modal').forEach(modal => {
        scrollLockObserver.observe(modal, { 
            attributes: true, 
            attributeFilter: ['style', 'class'] 
        });
    });
}

// Helper to format MCQs for clipboard (UPDATED: Includes Notes)
function formatMcqsForClipboard(mcqs) {
    return mcqs.map((mcq, index) => {
        // 1. Format Options
        const optionsText = mcq.options.map((opt, i) => {
            const label = getOptionLabel(i, mcq.question); 
            return `${label}. ${opt}`;
        }).join('\n');

        // 2. Format Correct Answer
        let answerLine = "";
        if (mcq.correctAnswer) {
            const correctIndex = mcq.options.indexOf(mcq.correctAnswer);
            const label = (correctIndex !== -1) ? getOptionLabel(correctIndex, mcq.question) : '?';
            answerLine = `Correct answer: ${label}. ${mcq.correctAnswer}`;
        } else {
            answerLine = `Correct answer: ${mcq.explanation || 'Cancelled'}`;
        }

        // 3. Format Note (NEW)
        if (mcq.note) {
            answerLine += `\nNote: ${mcq.note}`;
        }

        // 4. Combine
        return `${index + 1}. ${mcq.question}\n${optionsText}\n${answerLine}`;
    }).join('\n\n');
}


// Handler for Copy Buttons
async function handleMcqCopy(data) {
    if (!data || !data.mcqs || data.mcqs.length === 0) {
        showCustomAlert("No MCQs available to copy.", "error");
        return;
    }

    const textToCopy = formatMcqsForClipboard(data.mcqs);

    try {
        await navigator.clipboard.writeText(textToCopy);
        showCustomAlert(`${data.mcqs.length} MCQs copied to clipboard!`, "success");
    } catch (err) {
        console.error('Failed to copy: ', err);
        showCustomAlert("Failed to copy to clipboard.", "error");
    }
}

// Listener for "View Mode" Copy Button
document.getElementById('copy-view-mcq-btn')?.addEventListener('click', () => {
    handleMcqCopy(currentViewMcqData);
});

// Listener for "Study Mode" Copy Button
document.getElementById('copy-study-mcq-btn')?.addEventListener('click', () => {
    handleMcqCopy(currentStudyViewData);
});

// --- PREVENT ACCIDENTAL DATA LOSS ---
// This checks the Sync Status text before allowing a refresh.
window.addEventListener('beforeunload', function (e) {
    const statusText = document.getElementById('sync-status-text');
    
    // If the status is "Syncing..." (yellow) or "Unsaved changes" (yellow), warn the user.
    if (statusText && (statusText.textContent.includes('Syncing') || statusText.textContent.includes('Unsaved'))) {
        // Standard browser command to trigger the "Are you sure?" dialog
        e.preventDefault(); 
        e.returnValue = ''; 
    }
});

// --- SCROLL TOGGLE BUTTON LOGIC ---
const scrollBtn = document.getElementById('scroll-toggle-btn');
if (scrollBtn) {
    const scrollIcon = scrollBtn.querySelector('i');

    // 1. Monitor Scroll to change Icon
    window.addEventListener('scroll', () => {
        // If we are near the top (less than 300px down)
        if (window.scrollY < 300) {
            scrollIcon.classList.remove('fa-arrow-up');
            scrollIcon.classList.add('fa-arrow-down');
            scrollBtn.title = "Scroll to Bottom";
        } else {
            // We are scrolled down, show Up arrow
            scrollIcon.classList.remove('fa-arrow-down');
            scrollIcon.classList.add('fa-arrow-up');
            scrollBtn.title = "Scroll to Top";
        }
    });

    // 2. Click Action
    scrollBtn.addEventListener('click', () => {
        if (window.scrollY < 300) {
            // We are at the top -> Scroll to Bottom
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            // We are down -> Scroll to Top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}