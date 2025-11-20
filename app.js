
        // Import necessary functions from Firebase SDK
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithCustomToken, signInAnonymously, getRedirectResult, signInWithRedirect } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, setDoc, doc, getDoc, collection, query, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, Timestamp, where, orderBy, setLogLevel, documentId } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
             if (user) {
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
                console.log("Is Guest Mode:", isGuestMode); // <-- Good for debugging

                loginPrompt.style.display = 'none';
                userInfo.classList.remove('hidden');
                userDisplay.textContent = user.displayName || 'User';
                userEmailDisplay.textContent = user.email || (user.isAnonymous ? 'Guest (Read-Only)' : ''); // <-- MODIFIED
                userIdDisplay.textContent = `ID: ${userId}`;
				if (user.photoURL) {
                    userPhotoDisplay.src = user.photoURL;
                    userPhotoDisplay.classList.remove('hidden');
                } else {
                    userPhotoDisplay.classList.add('hidden');
                }
                userIdDisplay.title = 'Your unique User ID';

                // --- MODIFIED: HIDE/SHOW LOGOUT BUTTON ---
                if (isGuestMode) {
                    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Exit Guest Mode'; // Change button text
                } else {
                    logoutBtn.innerHTML = 'Log Out'; // Default text
                }
                logoutBtn.classList.remove('hidden');

                // --- MODIFIED: GUEST MODE HEADER ---
                let loggedInHTML = '';
                if (isGuestMode) {
                    loggedInHTML = `<div class="text-sm"><p class="font-semibold text-gray-700">Guest Mode</p><p class="text-gray-500 text-xs">Viewing Mehedi's Plan</p></div><button id="logout-btn-header" class="ml-3 action-button action-button-secondary text-xs px-3 py-1">Exit</button>`;
                } else {
                    loggedInHTML = `<div class="text-sm"><p class="font-semibold text-gray-700">${user.displayName || 'User'}</p><p class="text-gray-500 text-xs">${user.email || (user.isAnonymous ? 'Anonymous' : '')}</p></div><button id="logout-btn-header" class="ml-3 action-button action-button-danger text-xs px-3 py-1">Log Out</button>`;
                }
                authContainerDesktop.innerHTML = loggedInHTML;
                authContainerMobile.innerHTML = loggedInHTML.replace('ml-3', 'w-full mt-2').replace('logout-btn-header', 'logout-btn-mobile');

                document.getElementById('logout-btn-header')?.addEventListener('click', handleLogout);
                document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout);

                studyPlanContent.classList.remove('hidden');
                loadStudyPlans(); // Load plans (will load Mehedi's data)
            } else {
                // --- START: GUEST MODE LOGIC (LOGOUT) ---
                isGuestMode = false;
                // --- END: GUEST MODE LOGIC ---
                currentUser = null;
                userId = null;
                console.log("User logged out");

                loginPrompt.style.display = 'block';
                userInfo.classList.add('hidden');
                logoutBtn.classList.add('hidden');
				
				userPhotoDisplay.classList.add('hidden');
				userPhotoDisplay.src = "";
                 const loggedOutHTML = `<a href="index.html#signup" class="px-5 py-2 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors signup-button text-sm">Sign Up</a>`;
                 authContainerDesktop.innerHTML = loggedOutHTML;
                 authContainerMobile.innerHTML = loggedOutHTML.replace('px-5 py-2', 'block w-full text-center py-2');

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
 * NEW: This function automatically migrates a month from the
 * old "map" structure to the new "subcollection" structure.
 */
async function runMigrationForMonth(monthDocRef, oldWeeksMap) {
    try {
        console.log(`MIGRATION: Starting auto-migration for ${monthDocRef.id}...`);
        
        // We must import these functions here
        const { writeBatch, doc, deleteField } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        const batch = writeBatch(db);

        // 1. Copy all week data to the new subcollection
        for (const weekId of ['week1', 'week2', 'week3', 'week4']) {
            const weekData = oldWeeksMap[weekId];
            // Check if the weekData exists and has days
            if (weekData && (weekData.days || weekData.rows)) { // Check for old 'rows' bug too
                const newWeekDocRef = doc(db, monthDocRef.path, 'weeks', weekId);
                
                // Ensure data format is correct
                let daysArray = weekData.days || weekData.rows || []; 
                if (!Array.isArray(daysArray)) daysArray = []; // Safety check
                
                batch.set(newWeekDocRef, { days: daysArray });
                console.log(`MIGRATION: Adding ${weekId} to subcollection.`);
            }
        }

        // 2. Delete the old, oversized 'weeks' map from the parent document
        batch.update(monthDocRef, { weeks: deleteField() });
        console.log(`MIGRATION: Deleting old 'weeks' map.`);

        // 3. Commit all changes at once
        await batch.commit();
        
        console.log(`MIGRATION: Auto-migration successful for: ${monthDocRef.id}`);
        return true;
    
    } catch (e) {
        console.error(`MIGRATION FAILED for ${monthDocRef.id}:`, e);
        showCustomAlert(`Data migration failed for this month. Please contact support.`, "error");
        return false;
    }
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

                     // --- START: AUTO-MIGRATION SCRIPT ---
                     if (monthData.weeks) {
                         // This document is in the OLD format!
                         // We must migrate it before we can display it.
                         console.warn(`MIGRATION: Old 'weeks' map found for ${monthId}. Running migration...`);
                         setSyncStatus("Upgrading data...", "blue");
                         
                         const migrationSuccess = await runMigrationForMonth(monthDocSnap.ref, monthData.weeks);
                         
                         if (migrationSuccess) {
                             // The migration is done. The 'onSnapshot' listener will
                             // automatically fire again with the new, correct data.
                             // We just need to stop this *current* function from running.
                             console.log("MIGRATION: Complete. Awaiting data refresh...");
                             setSyncStatus("Upgrade complete!", "green");
                         } else {
                             // The migration failed.
                             currentMonthPlanDisplay.innerHTML = '<p class="text-red-500 text-center">A critical error occurred during data migration. Please refresh and try again.</p>';
                         }
                         return; // Stop this function. The listener will re-run.
                     }
                     // --- END: AUTO-MIGRATION SCRIPT ---
                     
                     // 3. NOW, fetch all the week documents from the subcollection
                     const weeksCollectionRef = collection(db, monthDocRef.path, 'weeks');
                     const weeksQuerySnapshot = await getDocs(weeksCollectionRef);
                     
                     const weeksData = {}; // This will hold { week1: {days:[]}, week2: {days:[]} }
                     weeksQuerySnapshot.forEach(doc => {
                         weeksData[doc.id] = doc.data();
                     });
                     
                     console.log("Fetched month data and", weeksQuerySnapshot.size, "week documents.");

                     // 4. Check for structural changes (new/deleted WEEKS)
                     const monthElement = currentMonthPlanDisplay.querySelector(`.card[data-month-id="${monthId}"]`);
                     let structureHasChanged = false;
                     
                     if (monthElement) {
                         const domWeekCount = monthElement.querySelectorAll('.week-section').length;
                         const dataWeekCount = Object.keys(weeksData).length;
                         if (domWeekCount !== dataWeekCount) {
                             structureHasChanged = true;
                         } else {
                            // Check for day count changes inside each week
                             for (const weekId in weeksData) {
                                 const domDayCount = monthElement.querySelectorAll(`.week-section[data-week-id="${weekId}"] .day-section`).length;
                                 const dataDayCount = weeksData[weekId]?.days?.length || 0;
                                 if (domDayCount !== dataDayCount) {
                                     structureHasChanged = true;
                                     break;
                                 }
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
                                     <th scope="col" class="px-3 py-2 w-[10%] md:w-[5%] center-cell completion-perc-header hidden text-center">%</th>
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

                 // Handle checkbox click
                 if (target.classList.contains('completion-checkbox')) {
                     if (!daySection?.classList.contains('editing')) {
                         row?.classList.toggle('row-completed', target.checked);
                         
                         // --- START: NEW OPTIMISTIC CHECKBOX SAVE ---
                         // চেকবক্স ক্লিক সেভ করার নতুন লজিক
                         (async () => {
                            setSyncStatus("Syncing...", "yellow");
                            const docRef = doc(db, getUserPlansCollectionPath(), monthId);
                            let daysArray;
                            try {
                                const docSnap = await getDoc(docRef);
                                if (!docSnap.exists()) throw new Error("Month document not found.");
                                daysArray = docSnap.data().weeks?.[weekId]?.days || [];
                            } catch (error) {
                                console.error("Error fetching data for checkbox save:", error);
                                setSyncStatus("Error", "red");
                                return;
                            }
                            
                            // DOM থেকে ডেটা পড়ুন (চেকবক্সের নতুন অবস্থা সহ)
                            
                            // --- START: MODIFIED ---
                            // Set the global var so saveDataToFirebase knows the weekId AND dayIndex
                            const dayIndex = parseInt(daySection.dataset.dayIndex); // <-- Add this
                            isCheckboxClickGlobal = { weekId: weekId, dayIndex: dayIndex }; // <-- Add dayIndex
                            const parseResult = await parseAndPrepareSaveData(daySection, weekId, true); // true = isCheckboxClick
                            // --- END: MODIFIED ---
                            
                            if (parseResult === null) {
                                setSyncStatus("Error", "red");
                                return;
                            }
                            
                            const { updatedRows, updatePayload } = parseResult;
                            
                            // তৎক্ষণাৎ প্রোগ্রেস বার আপডেট করুন
                            const dayDataForProgress = { rows: updatedRows };
                            updateWeeklyProgressUI(monthId, weekId); // এটি রি-ফেচ করবে
                            updateDailyProgressUI(monthId, weekId, dayIndex, dayDataForProgress);
                            
                            // ব্যাকগ্রাউন্ডে সেভ করুন
                            saveDataToFirebase(docRef, updatePayload, true); // true = isAutosave (no green "Synced" popup)
                         })();
                         // --- END: NEW OPTIMISTIC CHECKBOX SAVE ---

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


        // Toggle Edit Mode - Updated for Button Swap AND Autosave
        async function toggleDayEditMode(monthId, weekId, daySection, enterEditMode) {
             const dayIndex = parseInt(daySection.dataset.dayIndex);
             const tableBody = daySection.querySelector('tbody');
             const editButton = daySection.querySelector('.edit-day-btn'); // Top right button
             const saveButton = daySection.querySelector('.save-day-btn'); // Bottom button
             const editModeControls = daySection.querySelector('.edit-mode-controls');
             const deleteDayButton = daySection.querySelector('.delete-day-btn');
             const actionsHeader = daySection.querySelector('.actions-header');
             const completionPercHeader = daySection.querySelector('.completion-perc-header');

             setSyncStatus("Syncing...", "yellow");

             if (enterEditMode) {
                 // --- ENTERING EDIT MODE ---
                 daySection.classList.add('editing');
				 daySection.classList.remove('is-collapsed'); // Force expand on edit
                 editButton.classList.add('hidden'); // Hide Edit button
                 editModeControls.classList.remove('hidden'); // Show controls (including Save)
                 deleteDayButton.classList.remove('hidden');
                 actionsHeader.classList.remove('hidden');
                 completionPercHeader.classList.remove('hidden');

                 // --- START: MODIFIED ---
                 // Fetch the specific WEEK document
                 const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                 const weekDocSnap = await getDoc(weekDocRef);
                 const dayData = weekDocSnap.exists() ? weekDocSnap.data().days[dayIndex] : null;
                 // --- END: MODIFIED ---
                 
                 if (!dayData) { console.error("Could not find day data to edit."); setSyncStatus("Error", "red"); return; }

                 tableBody.innerHTML = dayData.rows.map((rowData, rowIndex) =>
                    createTableRow(monthId, weekId, dayIndex, rowIndex, rowData, true) // Render in edit mode
                 ).join('');
                 daySection.querySelectorAll('.completion-checkbox').forEach(cb => cb.disabled = true);
                 setSyncStatus("Editing...", "blue");

                 // --- AUTOSAVE LOGIC (START) ---
                 const autosaveHandler = (e) => {
                     if (e.target.classList.contains('editable-input') || e.target.classList.contains('vocab-input')) {
                         if (autosaveTimer) clearTimeout(autosaveTimer);
                         autosaveTimer = setTimeout(() => {
                             console.log("Autosaving changes...");
                             saveDayPlan(monthId, weekId, daySection, true); 
                         }, 2500); 
                     }
                 };
                 daySection.addEventListener('input', autosaveHandler);
                 daySection.autosaveHandler = autosaveHandler;
                 // --- AUTOSAVE LOGIC (END) ---

             } else {
                 // --- SAVING AND EXITING EDIT MODE (OPTIMISTIC) ---
                 
                 // 1. Stop autosave
                 if (autosaveTimer) clearTimeout(autosaveTimer);
                 if (daySection.autosaveHandler) {
                     daySection.removeEventListener('input', daySection.autosaveHandler);
                     daySection.autosaveHandler = null;
                 }
                 
                 // 2. Show Syncing
                 setSyncStatus("Syncing...", "yellow");

                 // 3. Get the path to the MONTH document
                 const monthDocRef = doc(db, getUserPlansCollectionPath(), monthId);

                 // 4. Parse DOM and prepare data (NOW ASYNC)
                 const parseResult = await parseAndPrepareSaveData(daySection, weekId);
                 
                 if (parseResult === null) {
                     setSyncStatus("Error", "red");
                     return; 
                 }
                 
                 const { updatedRows, updatePayload } = parseResult;

                 // 5. Update UI instantly
                 daySection.classList.remove('editing');
				 daySection.classList.add('saving');
                 daySection.classList.remove('is-collapsed'); 
                 editButton.classList.remove('hidden'); 
                 editModeControls.classList.add('hidden');
                 deleteDayButton.classList.add('hidden');
                 actionsHeader.classList.add('hidden');
                 completionPercHeader.classList.add('hidden');

                 tableBody.innerHTML = updatedRows.map((rowData, rowIndex) =>
                    createTableRow(monthId, weekId, dayIndex, rowIndex, rowData, false)
                 ).join('');
                 
                 const dayDataForProgress = { rows: updatedRows };
                 updateDailyProgressUI(monthId, weekId, dayIndex, dayDataForProgress);
				 
                 daySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                 
                 // 6. Save in background
                 saveDataToFirebase(monthDocRef, updatePayload, false);
				 daySection.classList.remove('saving');
             }
        }

        // Save Day Plan
        /**
         * ধাপ ১ (নতুন): DOM থেকে ডেটা পড়ে এবং সেভের জন্য প্রস্তুত করে (Synchronous)
         */
        /**
         * ধাপ ১ (নতুন): DOM থেকে ডেটা পড়ে এবং সেভের জন্য প্রস্তুত করে (Synchronous)
         */
        async function parseAndPrepareSaveData(daySection, weekId, isCheckboxClick = false) {
            try {
                const dayIndex = parseInt(daySection.dataset.dayIndex);
                
                // --- START: MODIFIED ---
                // Fetch the fresh data directly from the WEEK document
                const monthId = daySection.closest('.card[data-month-id]').dataset.monthId;
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);
                if (!weekDocSnap.exists()) throw new Error("Week document not found for parsing.");
                
                const freshDaysArray = weekDocSnap.data().days || [];
                const currentDayData = freshDaysArray[dayIndex];
                // --- END: MODIFIED ---
                
                if (!currentDayData) {
                    throw new Error(`Day data for index ${dayIndex} not found.`);
                }
                
                const updatedRows = [];
                const rowElements = daySection.querySelectorAll('tbody tr');

                rowElements.forEach((row) => {
                    let existingRowIndex = parseInt(row.dataset.rowIndex);
                    const existingRowData = !isNaN(existingRowIndex) && currentDayData.rows?.[existingRowIndex] ? currentDayData.rows[existingRowIndex] : {};

                    let subject, topic, comment, completed, completionPercentage, vocabData = null, story, mcqData = null;

                    if (daySection.classList.contains('editing') && !isCheckboxClick) {
                         // --- In Edit Mode ---
                         subject = (row.querySelector('.subject-input')?.value || '').trim();
                         comment = (row.querySelector('.comment-input')?.value || '').trim();
                         completed = existingRowData.completed || false;
                         const percInput = row.querySelector('.completion-perc-input')?.value;
                         completionPercentage = parsePercentage(percInput);
                         
                         story = (subject.toLowerCase() === 'vocabulary') ? (existingRowData.story || null) : null;
                         mcqData = existingRowData.mcqData || null; 

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
                         // --- Checkbox Click Mode ---
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
                
                // --- START: MODIFIED ---
                // Update the correct day in the fresh array
                freshDaysArray[dayIndex].rows = updatedRows;
                // The payload is now just the 'days' array. The key will be added by the caller.
                const updatePayload = { days: freshDaysArray };
                // --- END: MODIFIED ---
                
                return { updatedRows, updatePayload };

            } catch (error) {
                console.error("Error parsing day plan from DOM:", error);
                showCustomAlert("Error reading data from fields. Cannot save.");
                return null; // Parsing failed
            }
        }

        /**
         * ধাপ ২ (নতুন): ডেটাবেসে সেভ করে (Asynchronous)
         */
        async function saveDataToFirebase(monthDocRef, updatePayload, isAutosave = false) {
            try {
                if (!isAutosave) {
                    setSyncStatus("Syncing...", "yellow");
                }
                
                const editingDay = document.querySelector('.day-section.editing, .day-section.saving'); 
                
                let weekId;
                let dayIndexForTimestamp = null;
                let wasCheckboxClick = false;

                if (isAutosave && editingDay) {
                    // This is an autosave from typing
                    weekId = editingDay.closest('.week-section').dataset.weekId;
                } else if (isCheckboxClickGlobal) { 
                    // This is a checkbox click
                    weekId = isCheckboxClickGlobal.weekId;
                    dayIndexForTimestamp = isCheckboxClickGlobal.dayIndex;
                    wasCheckboxClick = true;
                    isCheckboxClickGlobal = null; // Clear it now that we've used it
                } else {
                    // This is a manual "Save" button click
                    const savingDay = document.querySelector('.day-section.saving');
                    if (savingDay) {
                        weekId = savingDay.closest('.week-section').dataset.weekId;
                        savingDay.classList.remove('saving'); // Clean up
                    }
                }

                if (!weekId) {
                    throw new Error("Could not determine weekId for save operation.");
                }

                // --- START: MODIFIED - PARALLEL SAVE ---
                
                // 1. Create a list of promises to run
                const savePromises = [];

                // 2. Promise 1: Save the (large) 'days' array to the WEEK document
                const weekDocRef = doc(db, monthDocRef.path, 'weeks', weekId);
                savePromises.push( updateDoc(weekDocRef, updatePayload) );
                
                // 3. Promise 2: If it was a checkbox click, save the (small) timestamp to the MONTH document
                if (wasCheckboxClick) {
                    const monthUpdatePayload = { 
                        lastCompletedDay: { 
                            timestamp: Timestamp.now(), 
                            weekId: weekId, 
                            dayIndex: dayIndexForTimestamp 
                        } 
                    };
                    // This save will trigger the onSnapshot listener for the month
                    savePromises.push( updateDoc(monthDocRef, monthUpdatePayload) );
                }

                // 4. Run all saves at the same time
                await Promise.all(savePromises);
                
                if (wasCheckboxClick) {
                    console.log("Updated lastCompletedDay timestamp on month doc.");
                }
                // --- END: MODIFIED - PARALLEL SAVE ---
                
                console.log("Save successful.");
                if (!isAutosave) {
                    setSyncStatus("Synced", "green");
                }
            } catch (error) {
                console.error("Error saving day plan to Firebase:", error);
                showCustomAlert("Error saving changes. Please check your connection and try again.");
                setSyncStatus("Error", "red");
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
		 
         function deleteDay(monthId, weekId, daySection, dayIndex) {
            if (!currentUser || !userId) return;
            
            const weekSection = daySection.closest('.week-section'); 
            daySection.remove();
            
            // ... (UI logic for buttons remains the same) ...
            const remainingDays = weekSection.querySelectorAll('.day-section').length;
            const buttonContainer = weekSection.querySelector('.days-container').nextElementSibling;
            let newButtonHtml = '';
            if (remainingDays < 7) {
                if (remainingDays > 0) {
                    newButtonHtml = `<button class="add-day-btn w-full mt-4" data-week-id="${weekId}"><i class="fas fa-plus"></i> Add New Day</button>`;
                } else {
                    newButtonHtml = `<button class="action-button mt-4 add-first-day-btn" data-week-id="${weekId}"><i class="fas fa-calendar-plus mr-2"></i> Add First Day</button>`;
                    const daysContainer = weekSection.querySelector('.days-container');
                    if (daysContainer) {
                        daysContainer.innerHTML = '<p class="text-gray-500 italic text-sm py-4 text-center">No days added yet.</p>';
                    }
                }
            } else {
                newButtonHtml = '<p class="text-center text-xs text-gray-400 mt-4">Maximum 7 days reached for this week.</p>';
            }
            if (buttonContainer) {
                buttonContainer.outerHTML = newButtonHtml;
            }
            // --- END: UI Logic ---
            
            setSyncStatus("Syncing...", "yellow");
            
            // --- START: MODIFIED ---
            const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
             
            getDoc(weekDocRef).then(weekDocSnap => {
                 if (!weekDocSnap.exists()) throw new Error("Week document not found.");
                 
                 let daysArray = weekDocSnap.data().days || [];
                 
                 if (!daysArray[dayIndex]) {
                    console.warn("Day not found in Firestore, UI is now in sync.");
                    setSyncStatus("Synced", "green");
                    return; 
                 }
                 
                 daysArray.splice(dayIndex, 1);
                 for (let i = dayIndex; i < daysArray.length; i++) { daysArray[i].dayNumber = i + 1; }
                 
                 return updateDoc(weekDocRef, { days: daysArray });
                 
             }).then(() => {
                 console.log("Delete command sent to Firestore.");
                 
                 // --- START: NEW FIX ---
                 // The UI is already updated. Just set the sync status.
                 setSyncStatus("Synced", "green");
                 // --- END: NEW FIX ---
                 
             }).catch(error => {
                 console.error("Error deleting day:", error); 
                 showCustomAlert("Error deleting day. Please refresh.", "error"); 
                 setSyncStatus("Error", "red");
             });
             // --- END: MODIFIED ---
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

        // Add New Day
        async function addNewDay(monthId, weekId, weekSection) {
            if (!currentUser || !userId) return;
            
            setSyncStatus("Syncing...", "yellow");
            
            const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
             
            try {
                 const weekDocSnap = await getDoc(weekDocRef);
                 let daysArray = [];
                 let newDayData;
                 let newDayIndex = 0; // The index for the new day

                 if (weekDocSnap.exists()) {
                     daysArray = weekDocSnap.data().days || [];
                     if (daysArray.length >= 7) { 
                         showCustomAlert("You cannot add more than 7 days to a week."); 
                         setSyncStatus("Synced", "green"); 
                         return; 
                     }
                     
                     newDayIndex = daysArray.length; // The new day will be at this index
                     
                     const lastDayIndex = daysArray.length - 1;
                     if (lastDayIndex >= 0) {
                         const lastDayRows = daysArray[lastDayIndex].rows || [];
                         newDayData = { dayNumber: daysArray.length + 1, date: '', rows: lastDayRows.map(row => ({ subject: row.subject || '', topic: (row.subject?.toLowerCase() === 'vocabulary') ? null : (row.topic || ''), completed: false, comment: '', completionPercentage: row.completionPercentage ?? null, vocabData: (row.subject?.toLowerCase() === 'vocabulary') ? (row.vocabData || null) : null, story: null })) };
                     } else {
                         newDayData = { dayNumber: 1, date: '', rows: [{ subject: '', topic: '', completed: false, comment: '', completionPercentage: null, vocabData: null, story: null }] };
                     }
                     
                     await updateDoc(weekDocRef, { days: arrayUnion(newDayData) });
                     
                 } else {
                     // newDayIndex is already 0
                     newDayData = { dayNumber: 1, date: '', rows: [{ subject: '', topic: '', completed: false, comment: '', completionPercentage: null, vocabData: null, story: null }] };
                     await setDoc(weekDocRef, { days: [newDayData] });
                 }
                 
                 console.log("New day added successfully.");
                 
                 // --- START: NEW UI FIX ---
                 // Manually build and insert the new day's HTML
                 
                 // 1. Create the new day's HTML
                 const newDayHtml = createDayElement(monthId, weekId, newDayIndex, newDayData);
                 
                 // 2. Find the days container
                 const daysContainer = weekSection.querySelector('.days-container');
                 if (!daysContainer) return;

                 // 3. If this is the first day, clear the "No days" message
                 if (newDayIndex === 0) {
                     daysContainer.innerHTML = '';
                 }
                 
                 // 4. Insert the new day
                 daysContainer.insertAdjacentHTML('beforeend', newDayHtml);

                 // 5. Update the "Add Day" button
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

                 // 6. Expand the new day (using the accordion logic)
                 const newDayElement = daysContainer.querySelector(`[data-day-index="${newDayIndex}"]`);
                 if (newDayElement) {
                     // Find parent month and collapse all others
                     const monthElement = newDayElement.closest('.card[data-month-id]');
                     if (monthElement) {
                        monthElement.querySelectorAll('.day-section:not(.is-collapsed)').forEach(openDay => {
                            openDay.classList.add('is-collapsed');
                        });
                     }
                     // Expand the new day
                     newDayElement.classList.remove('is-collapsed');
                     // Scroll to it smoothly
                     newDayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
                 
                 setSyncStatus("Synced", "green");
                 // --- END: NEW UI FIX ---
                 
             } catch (error) { 
                 console.error("Error adding new day:", error); 
                 showCustomAlert("Error adding new day."); 
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
                    // Check if the "Done" checkbox is checked
                    if (row.completed) {
                        // If it is, get the percentage value from the row
                        const perc = parsePercentage(row.completionPercentage);
                        
                        // If the percentage is a valid number (not null), add it to the sum
                        if (perc !== null && !isNaN(perc)) {
                             totalPercentageSum += perc;
                        }
                    }
                });
            });
             
             // Return the raw sum of *completed* rows, rounded.
            return Math.round(totalPercentageSum);
        }
		
		
		function calculateDailyProgress(dayData) {
            if (!dayData || !dayData.rows || dayData.rows.length === 0) return 0;
            let totalPercentageSum = 0; 
            
            dayData.rows.forEach(row => {
                // Check if the "Done" checkbox is checked
                if (row.completed) {
                    // If it is, get the percentage value from the row
                    const perc = parsePercentage(row.completionPercentage);
                    
                    // If the percentage is a valid number (not null), add it to the sum
                    if (perc !== null && !isNaN(perc)) {
                         totalPercentageSum += perc;
                    }
                }
            });
             
            // --- UPDATED CALCULATION ---
            // Multiply the total sum by 7, as requested, and then round it.
            return Math.round(totalPercentageSum * 7);
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
            
            modal.style.display = "none"; 

            // --- START: NEW QUIZ RESET LOGIC ---
            // If we are closing the quiz modal, check if it needs to be reset
            if (modalId === 'quiz-modal') {
                const resultsScreen = document.getElementById('quiz-results-screen');
                const reviewScreen = document.getElementById('quiz-review-screen');
                
                // Check if either the results or review screen is visible
                if (!resultsScreen.classList.contains('hidden') || !reviewScreen.classList.contains('hidden')) {
                    console.log("Resetting quiz modal state to start screen.");
                    
                    // Hide results and review screens
                    resultsScreen.classList.add('hidden');
                    reviewScreen.classList.add('hidden');
                    
                    // Show the start screen
                    const startScreen = document.getElementById('quiz-start-screen');
                    startScreen.classList.remove('hidden');

                    // Clear old quiz data to be safe
                    currentQuizQuestions = [];
                    currentVocabData = null;
                    currentMcqData = null;
                }
            }
            // --- END: NEW QUIZ RESET LOGIC ---
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

            if (strVal.includes('/')) {
                const parts = strVal.split('/'); 
                const num = parseFloat(parts[0]); 
                const den = parseFloat(parts[1]);
                if (!isNaN(num) && !isNaN(den) && den !== 0) { 
                    // User wants 3/2 -> 1.5. Just do the division and round to 10 decimal places.
                    return parseFloat((num / den).toFixed(10));
                }
            }
            
            strVal = strVal.replace(',', '.').replace('%', ''); // Allow comma, dot, and % sign
            const floatVal = parseFloat(strVal);
            
            if (!isNaN(floatVal)) { 
                // User wants to input any number. Do not clamp it.
                return parseFloat(floatVal.toFixed(10));
            } 
            
            return null; // Invalid input
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

        
        /**
         * Resets state and starts the quiz game.
         */
        function runQuizGame() {
            quizStartScreen.classList.add('hidden');
            quizResultsScreen.classList.add('hidden');
            quizMainScreen.classList.remove('hidden');
			quizReviewScreen.classList.add('hidden');

            // --- START: NEW RE-GENERATION LOGIC ---
            // "Try Again" বাটনের জন্য প্রশ্নগুলো রি-জেনারেট করুন
            if (currentVocabData) {
                // এটি একটি Vocab কুইজ, সোর্স থেকে রি-জেনারেট করুন
                // --- START: FIX ---
                if (!currentOptionPool) {
                    // This is a fallback for "Try Again" from a saved result
                    // where the global pool wasn't saved.
                    console.warn("No option pool found. Falling back to simple generation for 'Try Again'.");
                    currentOptionPool = {
                        allWords: currentVocabData.map(v => v.word),
                        allBanglaMeanings: currentVocabData.map(v => v.banglaMeaning),
                        allSynonyms: currentVocabData.map(v => v.synonym).filter(Boolean)
                    };
                }
                // Call with the correct 2 arguments
                currentQuizQuestions = generateQuizData(currentVocabData, currentOptionPool);
                // --- END: FIX ---
            } else if (currentMcqData) {
                // এটি একটি MCQ কুইজ, সোর্স থেকে রি-জেনারেট করুন
                currentQuizQuestions = shuffleArray(currentMcqData.map(mcq => ({ // <-- ১. এখানে shuffleArray যোগ করুন
                    question: mcq.question,
                    options: [...mcq.options], // <-- ২. এখান থেকে shuffleArray রিমুভ করুন
                    correctAnswer: mcq.correctAnswer,
                    userAnswer: null, // উত্তর রিসেট করুন
                    isCorrect: null // স্ট্যাটাস রিসেট করুন
                }))); // <-- ৩. এখানে একটি অতিরিক্ত ')' বন্ধনী যোগ করুন
            } else {
                // এটি হওয়া উচিত নয়, তবে ফলব্যাক হিসেবে পুরনো প্রশ্নগুলো শাফল করুন
                console.warn("No source data found for restart, re-shuffling old questions.");
                currentQuizQuestions = shuffleArray(currentQuizQuestions);
            }
            // --- END: NEW RE-GENERATION LOGIC ---

            // Reset state
            currentQuizQuestionIndex = 0;
            currentQuizScore = 0;

            quizScoreEl.textContent = `Score: 0.00`;
            quizRestartBtn.onclick = runQuizGame;
            
            // --- START: TIMER LOGIC ---
            const totalQuestions = currentQuizQuestions.length;
            const totalTimeInSeconds = totalQuestions * 36;
            startTimer(totalTimeInSeconds); // Start the countdown!
            // --- END: TIMER LOGIC ---
            
            loadQuizQuestion();
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
         * Displays the current question and options. (UPGRADED with DocumentFragment)
         */
        function loadQuizQuestion() {
            quizOptionsContainer.innerHTML = '';
            
            const q = currentQuizQuestions[currentQuizQuestionIndex];
            
            quizQuestionNumber.textContent = `Question ${currentQuizQuestionIndex + 1}/${currentQuizQuestions.length}`;
            quizQuestionText.textContent = q.question;

            // --- Button State Logic ---
            quizNextBtn.disabled = (q.userAnswer === null);
            quizSkipBtn.hidden = (q.userAnswer !== null);
            quizPrevBtn.hidden = (currentQuizQuestionIndex === 0);

            // --- START: OPTIMIZED RENDERING ---
            // 1. একটি ভার্চুয়াল কন্টেইনার তৈরি করুন (এটি দ্রুত)
            const fragment = new DocumentFragment();

            // 2. অপশন বাটনগুলো তৈরি করুন এবং সেগুলোকে fragment-এ যোগ করুন
            q.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.className = "quiz-option-btn";
				
				if (banglaRegex.test(option)) {
					button.classList.add('quiz-option-bangla');
				}

                if (q.userAnswer !== null) {
                    // This question has been answered, show feedback
                    button.disabled = true;
                    if (option === q.correctAnswer) {
                        button.classList.add('correct');
                    } else if (option === q.userAnswer) {
                        button.classList.add('incorrect');
                    }
                } else {
                    // This question is new, add click listener
                    button.onclick = () => selectQuizAnswer(button, option);
                }
                fragment.appendChild(button); // fragment-এ যোগ করুন
            });

            // 3. সবশেষে, fragment-টিকে মাত্র একবার পেইজে যোগ করুন
            quizOptionsContainer.appendChild(fragment);
            // --- END: OPTIMIZED RENDERING ---
        }
        
        /**
         * Handles the user's answer selection. (UPGRADED with Auto-Advance)
         */
        function selectQuizAnswer(selectedButton, selectedOption) {
            const q = currentQuizQuestions[currentQuizQuestionIndex];
            
            // Do nothing if already answered
            if (q.userAnswer !== null) return;

            // Store the answer
            q.userAnswer = selectedOption;
            const isCorrect = (selectedOption === q.correctAnswer); // Check correctness
            q.isCorrect = isCorrect;
            
            // Apply scoring
            if (isCorrect) {
                currentQuizScore++;
            } else {
                currentQuizScore -= 0.25;
            }
            quizScoreEl.textContent = `Score: ${currentQuizScore.toFixed(2)}`;

            // Apply visual feedback
            Array.from(quizOptionsContainer.children).forEach(btn => {
                btn.disabled = true;
                if (btn.textContent === q.correctAnswer) {
                    btn.classList.add('correct');
                } else if (btn.textContent === selectedOption) {
                    btn.classList.add('incorrect');
                }
            });
            
            // --- START: NEW AUTO-ADVANCE LOGIC ---
            if (isCorrect) {
                // Answer is correct: Hide "Skip" and wait 1 second, then auto-advance
                quizSkipBtn.hidden = true;
                quizNextBtn.disabled = true; // Prevent clicking "Next" during the delay
                
                setTimeout(() => {
                    // Logic copied from the 'quizNextBtn' listener
                    currentQuizQuestionIndex++;
                    if (currentQuizQuestionIndex >= currentQuizQuestions.length) {
                        showQuizResults();
                    } else {
                        loadQuizQuestion();
                        quizQuestionArea.classList.add('slide-in-right'); // <-- ADD THIS
                    }
                }, 100); // 0.1-second (100ms) delay.
                
            } else {
                // Answer is wrong: Stay on the page and enable "Next"
                quizNextBtn.disabled = false;
                quizSkipBtn.hidden = true;
            }
            // --- END: NEW AUTO-ADVANCE LOGIC ---
        }

        function showQuizResults() {
			if (quizTimerInterval) clearInterval(quizTimerInterval);
            const quizEndTime = Date.now(); // <-- কুইজ শেষ হওয়ার সময় সেভ করুন
            
            quizMainScreen.classList.add('hidden');
            quizResultsScreen.classList.remove('hidden');
            quizReviewScreen.classList.add('hidden');

            // --- START: NEW CALCULATIONS ---
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
            
            // [স্কোর ফিক্স]: এই গণনাটি এখন সঠিক
            const finalScore = correctScore + wrongScore;
            
            // [পার্সেন্টেজ ফিক্স]: উপরের 'finalScore' ঠিক হওয়ায় এটিও ঠিক হয়ে যাবে
            const percentage = (totalQuestions > 0) ? (Math.max(0, finalScore) / totalQuestions) * 100 : 0;
            
            // [টাইম ফিক্স]: ধাপ ১ ও ২ থেকে পাওয়া ভেরিয়েবল দিয়ে সঠিক সময় গণনা
            const timeTakenInSeconds = Math.round((quizEndTime - quizStartTime) / 1000);
            // --- END: NEW CALCULATIONS ---
            
			// --- START: CAPTURE RESULT DATA FOR SAVING ---
            const quizType = currentMcqData ? 'MCQ' : 'Vocab';
            
            // Get the subject and topic info we saved when the quiz started
            const subjectInfo = window.currentQuizSubjectInfo || { subjectName: quizType, topicDetail: 'Quiz' };
            const { subjectName, topicDetail } = subjectInfo;

            // --- Topic Name Logic (UPGRADED for "By Day" tab) ---
            let baseTopicName = ''; // This will be like "Day 2, W3, 2025-11"
            let topicLink = null; 

            if (currentMcqTarget) { // For MCQ quizzes
                const { quizType: mcqAggregatedType, monthId, weekId, dayIndex } = currentMcqTarget;
                
                if (mcqAggregatedType === 'day' || (dayIndex !== null && dayIndex !== undefined)) {
                    const dayNum = document.querySelector(`#day-${monthId}-${weekId}-${dayIndex} h4`)?.textContent || `Day ${parseInt(dayIndex) + 1}`;
                    baseTopicName = `${dayNum}, ${weekId.replace('week', 'W')}, ${monthId}`;
                    topicLink = `#day-${monthId}-${weekId}-${dayIndex}`; 
                } else if (mcqAggregatedType === 'week') {
                    baseTopicName = `${weekId.replace('week', 'Week ')}, ${monthId}`;
                    topicLink = `#mcq-quiz-center`; 
                } else if (mcqAggregatedType === 'month') {
                    baseTopicName = `${monthId} (All)`;
                    topicLink = `#mcq-quiz-center`; 
                } else {
                    // Fallback for single-row MCQ quiz
                    const dayNum = document.querySelector(`#day-${monthId}-${weekId}-${dayIndex} h4`)?.textContent || `Day ${parseInt(dayIndex) + 1}`;
                    baseTopicName = `${dayNum}, ${weekId.replace('week', 'W')}, ${monthId}`;
                    topicLink = `#day-${monthId}-${weekId}-${dayIndex}`;
                }
            } else if (window.currentQuizSourceInfo) { // For Vocab quizzes
                const { monthId, weekId, dayIndex, rowIndex } = window.currentQuizSourceInfo;
                
                if (dayIndex !== undefined && rowIndex !== undefined) {
                    const dayNum = document.querySelector(`#day-${monthId}-${weekId}-${dayIndex} h4`)?.textContent || `Day ${parseInt(dayIndex) + 1}`;
                    baseTopicName = `${dayNum}, ${weekId.replace('week', 'W')}, ${monthId}`;
                    topicLink = `#day-${monthId}-${weekId}-${dayIndex}`;
                } else if (weekId) { // Aggregated week vocab
                    baseTopicName = `${weekId.replace('week', 'Week ')}, ${monthId}`;
                    topicLink = `#vocab-quiz-center`;
                }
            }
            
            // This is the new "Exam Topic" name for the "By Day" tab
            const finalTopicName = `${subjectName} - ${baseTopicName}`; 
            // --- End Topic Name Logic ---
            
            currentQuizResultData = {
                quizType: quizType,
                topicName: finalTopicName, // <-- e.g., "Basic View - Day 2..."
                subjectName: subjectName,  // <-- NEW (e.g., "Basic View")
                topicDetail: topicDetail,  // <-- NEW (e.g., "Chapter 1: Intro" or "Vocabulary")
                topicLink: topicLink, 
                saveTimestamp: null, // Will be set on save
                // Summary Stats
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
                // Full Data for Review
                questions: currentQuizQuestions // Save the full question set
            };
            
            
            
            // Enable the save button
            if(saveBtn) {
                // --- START: GUEST MODE HIDE ---
                if (isGuestMode) {
                    saveBtn.style.display = 'none'; // Hide save button for guests
                } else {
                    saveBtn.style.display = 'inline-flex'; // Show for real users
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="fas fa-save mr-2"></i>Save`;
                }
                // --- END: GUEST MODE HIDE ---
            }
            // --- END: CAPTURE RESULT DATA FOR SAVING ---
			
            // --- START: POPULATE SUMMARY TABLE ---
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
            // --- END: POPULATE SUMMARY TABLE ---
            
            // Show/Hide the "Review Wrong" button
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
            // Just show/hide the correct screens
            quizReviewScreen.classList.add('hidden');
            quizResultsScreen.classList.remove('hidden');
        });
        
        // 3. The function to build and show the review screen
        function showReviewScreen() {
            quizResultsScreen.classList.add('hidden');
            quizReviewScreen.classList.remove('hidden');
            quizReviewContent.innerHTML = ''; // Clear old content
            
            const wrongAnswers = currentQuizQuestions.filter(q => q.isCorrect === false);
            
            if (wrongAnswers.length === 0) {
                quizReviewContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">You got all questions correct!</p>';
                return;
            }
            
            let html = '';
            wrongAnswers.forEach(q => {
                html += `
                <div class="review-item">
                    <p class="review-question">${escapeHtml(q.question)}</p>
                    <div class="review-options">
                        ${q.options.map(option => {
                            let className = 'review-option';
                            if (option === q.correctAnswer) {
                                className += ' correct'; // This is the correct one
                            } else if (option === q.userAnswer) {
                                className += ' incorrect'; // This is the one the user (wrongly) chose
                            }
                            return `<div class="${className}">${escapeHtml(option)}</div>`;
                        }).join('')}
                    </div>
                </div>
                `;
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
		
		// 4. Function to start a week-long quiz
        async function startWeekQuiz(monthId, weekId) {
            quizTitle.textContent = 'Vocabulary Quiz';
            window.currentQuizSourceInfo = { monthId, weekId };
			window.currentQuizSubjectInfo = { subjectName: "Vocabulary", topicDetail: "Weekly Vocabulary" };
            closeModal('quiz-center-modal');
            quizModal.style.display = "block";
            quizMainScreen.classList.add('hidden');
            quizResultsScreen.classList.add('hidden');
            quizStartScreen.classList.remove('hidden');
            
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
                const totalTimeInSeconds = totalQuestions * 36;
                
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

        // 1. "Add/Edit MCQ" বাটনে ক্লিক করলে এই ফাংশনটি কল হবে
        async function openAddMcqModal(monthId, weekId, dayIndex, rowIndex) {
            currentMcqTarget = { monthId, weekId, dayIndex, rowIndex };
            
            setSyncStatus("Loading...", "blue");
            try {
                // --- START: MODIFIED ---
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);
                // --- END: MODIFIED ---
                
                let rawText = '';
                if (weekDocSnap.exists()) {
                    const mcqData = weekDocSnap.data().days?.[dayIndex]?.rows?.[rowIndex]?.mcqData;
                    
                    if (mcqData) {
                        rawText = mcqData.map((mcq, index) => {
                            const options = mcq.options.map((opt, i) => `${['ক', 'খ', 'গ', 'ঘ'][i]}. ${opt}`).join('\n');
                            const correctPrefix = ['ক', 'খ', 'ג', 'ঘ'][mcq.options.indexOf(mcq.correctAnswer)];
                            return `${['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'][index] || (index + 1)}. ${mcq.question}\n${options}\nসঠিক উত্তর: ${correctPrefix}. ${mcq.correctAnswer}\n`;
                        }).join('\n');
                    }
                }
                mcqPasteTextarea.value = rawText; 
                setSyncStatus("Synced", "green");
            } catch (error) {
                console.error("Error fetching MCQ data for modal:", error);
                setSyncStatus("Error", "red");
            }

            addMcqModal.style.display = 'block';
        }

        // 2. Modal এর "Parse & Save MCQs" বাটনে ক্লিক করলে এই ফাংশনটি কল হবে
        saveMcqBtn.addEventListener('click', () => { 
            if (!currentMcqTarget) return;

            const { monthId, weekId, dayIndex, rowIndex } = currentMcqTarget;
            const rawText = mcqPasteTextarea.value;
            const parsedData = parseMcqText(rawText);

            closeModal('add-mcq-modal');
            setSyncStatus("Syncing...", "yellow");
            
            (async () => {
                try {
                    // --- START: MODIFIED ---
                    const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                    const weekDocSnap = await getDoc(weekDocRef);
                    // --- END: MODIFIED ---

                    if (!weekDocSnap.exists()) throw new Error("Week document not found.");

                    let daysArray = weekDocSnap.data().days || [];
                    
                    if (daysArray[dayIndex] && daysArray[dayIndex].rows[rowIndex]) {
                        
                        daysArray[dayIndex].rows[rowIndex].mcqData = parsedData.length > 0 ? parsedData : null;
                        
                        // --- START: MODIFIED ---
                        const updatePayload = { days: daysArray };
						await updateDoc(weekDocRef, updatePayload);
                        // --- END: MODIFIED ---
                        
                        console.log("MCQs saved successfully in background for day:", dayIndex);
                        setSyncStatus("Synced", "green");
                        showCustomAlert(`${parsedData.length} MCQs saved successfully!`, "success");

                        // --- START: NEW UI FIX ---
                        // Manually update the button text without a full reload
                        try {
                            const daySection = document.querySelector(`[data-month-id="${monthId}"] [data-week-id="${weekId}"] [data-day-index="${dayIndex}"]`);
                            if (daySection) {
                                const button = daySection.querySelector(`button.add-row-mcq-btn[data-row-index="${rowIndex}"]`);
                                if (button) {
                                    if (parsedData.length > 0) {
                                        button.innerHTML = `<i class="fas fa-pencil-alt mr-1"></i> Edit Qs`;
                                    } else {
                                        // This handles the case where you deleted all MCQs
                                        button.innerHTML = `<i class="fas fa-plus mr-1"></i> Add Qs`;
                                    }
                                }
                            }
                        } catch (uiError) {
                            console.error("Error updating button UI:", uiError);
                        }
                        // --- END: NEW UI FIX ---

                    } else {
                        throw new Error("Target day for MCQs not found.");
                    }
                } catch (error) {
                    console.error("Error parsing or saving MCQs in background:", error);
                    showCustomAlert("Error saving MCQs. Please try again.", "error");
                    setSyncStatus("Error", "red");
                } finally {
                    currentMcqTarget = null;
                }
            })(); 
        });

        // 3. ✨ The Magic Parser Function (Regex) - (UPGRADED for ALL Formats)
        function parseMcqText(text) {
            let cleanText = text.replace(/\n*([০-৯0-9]+\.)/g, '\n$1');
            const mcqData = [];
            
            // --- START: NEW SIMPLER Regex ---
            // This Regex now captures everything after "Correct answer:" into ONE group
            const mcqRegex = 
/(?:[০-৯0-9]+)\.\s*([\s\S]+?)\n(?:(?:ক\.)|(?:a\.))\s*([\s\S]+?)\n(?:(?:খ\.)|(?:b\.))\s*([\s\S]+?)\n(?:(?:গ\.)|(?:c\.))\s*([\s\S]+?)\n(?:(?:ঘ\.)|(?:d\.))\s*([\s\S]+?)\n(?:(?:সঠিক উত্তর)|(?:Correct answer)):\s*([\s\S]+?)(?=\n[০-৯0-9]+\.|\n*$)/gi;
            // --- END: NEW SIMPLER Regex ---
            
            let match;
            while ((match = mcqRegex.exec(cleanText)) !== null) {
                try {
                    const question = match[1].trim();
                    const options = [
                        match[2].trim(), // opt a/ক
                        match[3].trim(), // opt b/খ
                        match[4].trim(), // opt c/গ
                        match[5].trim()  // opt d/ঘ
                    ];
                    
                    // --- START: NEW ROBUST LOGIC ---
                    // match[6] contains EVERYTHING after the colon.
                    // e.g., "b", "b. The ...", "The ..."
                    const answerString = match[6].trim();
                    const answerStringLower = answerString.toLowerCase();
                    let correctAnswer = null;

                    // Test 1: Check for short prefix (e.g., "b" or "খ")
                    if (answerStringLower === 'a' || answerStringLower === 'ক') {
                        correctAnswer = options[0];
                    } else if (answerStringLower === 'b' || answerStringLower === 'খ') {
                        correctAnswer = options[1];
                    } else if (answerStringLower === 'c' || answerStringLower === 'গ') {
                        correctAnswer = options[2];
                    } else if (answerStringLower === 'd' || answerStringLower === 'ঘ') {
                        correctAnswer = options[3];
                    }

                    // Test 2: If no match, check for prefix with text (e.g., "b. The...")
                    if (correctAnswer === null) {
                        if (answerStringLower.startsWith('a.') || answerStringLower.startsWith('ক.')) {
                            correctAnswer = options[0];
                        } else if (answerStringLower.startsWith('b.') || answerStringLower.startsWith('খ.')) {
                            correctAnswer = options[1];
                        } else if (answerStringLower.startsWith('c.') || answerStringLower.startsWith('গ.')) {
                            correctAnswer = options[2];
                        } else if (answerStringLower.startsWith('d.') || answerStringLower.startsWith('ঘ.')) {
                            correctAnswer = options[3];
                        }
                    }

                    // Test 3: If still no match, check if the full string matches an option
                    if (correctAnswer === null) {
                        // Check for an exact (case-sensitive) match
                        let found = false;
                        for (const opt of options) {
                            if (opt === answerString) {
                                correctAnswer = opt;
                                found = true;
                                break;
                            }
                        }
                        // If no exact match, check for a case-insensitive match
                        if (!found) {
                             for (const opt of options) {
                                if (opt.toLowerCase() === answerStringLower) {
                                    correctAnswer = opt;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (!correctAnswer) {
                        console.warn("Could not determine correct answer for:", question, "--- Got:", answerString);
                        continue; // Skip this question
                    }
                    // --- END: NEW ROBUST LOGIC ---

                    mcqData.push({
                        question: question,
                        options: options,
                        correctAnswer: correctAnswer
                    });
                } catch (e) {
                    console.error("Failed to parse one MCQ block:", e, match);
                }
            }
            return mcqData;
        }

        // 4. "View MCQ" বাটনে ক্লিক করলে
        async function openViewMcqModal(monthId, weekId, dayIndex, rowIndex) {
            viewMcqContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">Loading MCQs...</p>';
            viewMcqModal.style.display = 'block';

            try {
                // --- START: MODIFIED ---
                const weekDocRef = doc(db, getUserPlansCollectionPath(), monthId, 'weeks', weekId);
                const weekDocSnap = await getDoc(weekDocRef);
                if (!weekDocSnap.exists()) throw new Error("Week document not found.");

                const dayData = weekDocSnap.data().days?.[dayIndex];
                // --- END: MODIFIED ---
                
                if (!dayData) throw new Error("Day data not found.");

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
                    viewMcqContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">No MCQs found for this entry.</p>';
                    return;
                }

                let html = '';
                mcqData.forEach((mcq, index) => {
                    html += `
                        <div class="mcq-item">
                            <p class="mcq-question">${index + 1}. ${escapeHtml(mcq.question)}</p>
                            <ol class="mcq-options">
                                ${mcq.options.map((opt, i) => `
                                    <li class="mcq-option ${opt === mcq.correctAnswer ? 'mcq-correct-answer' : ''}">
                                        ${['ক', 'খ', 'গ', 'ঘ'][i]}. ${escapeHtml(opt)}
                                    </li>
                                `).join('')}
                            </ol>
                            <p class="mcq-final-answer">সঠিক উত্তর: ${escapeHtml(mcq.correctAnswer)}</p>
                        </div>
                    `;
                });
                viewMcqContent.innerHTML = html;

            } catch (error) {
                console.error("Error loading MCQs for viewing:", error);
                viewMcqContent.innerHTML = '<p class="text-center text-red-500 py-10">Could not load MCQs.</p>';
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

            quizModal.style.display = "block";
            quizMainScreen.classList.add('hidden');
            quizResultsScreen.classList.add('hidden');
            quizReviewScreen.classList.add('hidden');
            quizStartScreen.classList.remove('hidden');
            
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
                const totalTimeInSeconds = totalQuestions * 36;
                
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
        // UPGRADED: Generates questions first to set timer
        async function startMcqQuiz(monthId, weekId, dayIndex, rowIndex) {
            quizTitle.textContent = 'MCQ Quiz';
			currentMcqTarget = { monthId, weekId, dayIndex, rowIndex };
            quizModal.style.display = "block";
            quizMainScreen.classList.add('hidden');
            quizResultsScreen.classList.add('hidden');
            quizStartScreen.classList.remove('hidden');
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
                    userAnswer: null,
                    isCorrect: null
                }));
                
                const totalQuestions = currentQuizQuestions.length;
                const totalTimeInSeconds = totalQuestions * 36;
                
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
        const masterMcqModal = document.getElementById('master-mcq-modal');
        const masterMcqContent = document.getElementById('master-mcq-content');
        const totalMcqCountSpan = document.getElementById('total-mcq-count');
        const mcqQuizCenterModal = document.getElementById('mcq-quiz-center-modal');
        const mcqQuizCenterContent = document.getElementById('mcq-quiz-center-content');

        // 2. Add listener to the main "MCQ List" header button
        document.getElementById('show-master-mcq-btn').addEventListener('click', displayMasterMcqList);

        // 3. Function to open and populate the Master MCQ List (UPGRADED STYLE & LOGIC)
        async function displayMasterMcqList() {
            if (!currentUser || !userId) {
                showCustomAlert("Please log in to see your MCQ list.");
                return;
            }

            masterMcqModal.style.display = "block";
            masterMcqContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">Loading all MCQs...</p>';
            totalMcqCountSpan.textContent = "...";
            setSyncStatus("Loading...", "blue");

            let allMcqsHtml = '';
            let totalMcqCount = 0;

            try {
                const plansCollectionPath = getUserPlansCollectionPath();
                const q = query(collection(db, plansCollectionPath), orderBy(documentId(), "asc"));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    masterMcqContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">No study plans found.</p>';
                    totalMcqCountSpan.textContent = "0";
                    setSyncStatus("Synced", "green"); 
                    return;
                }

                for (const docSnap of querySnapshot.docs) {
                    const monthId = docSnap.id;
                    const monthData = docSnap.data();
                    const monthName = monthData.monthName || monthId;

                    let monthHasMcqs = false;
                    let monthWeekContainerHtml = '';
                    
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

                        let weekHasMcqs = false;
                        let weekDayContainerHtml = ''; 

                        for (let dayIndex = 0; dayIndex < weekData.days.length; dayIndex++) {
                            const day = weekData.days[dayIndex];
                            
                            const dayMcqs = day.rows?.reduce((acc, row) => {
                                if (row.mcqData) acc.push(...row.mcqData);
                                return acc;
                            }, []) || [];

                            if (dayMcqs.length > 0) {
                                monthHasMcqs = true;
                                weekHasMcqs = true;
                                totalMcqCount += dayMcqs.length;
                                
                                let dayMcqItemsHtml = '';
                                dayMcqs.forEach((mcq, index) => { 
                                    dayMcqItemsHtml += `
                                        <div class="mcq-item">
                                            <p class="mcq-question">${index + 1}. ${escapeHtml(mcq.question)}</p>
                                            <ol class="mcq-options">
                                                ${mcq.options.map((opt, i) => `
                                                    <li class="mcq-option ${opt === mcq.correctAnswer ? 'mcq-correct-answer' : ''}">
                                                        ${['ক', 'খ', 'গ', 'ঘ'][i]}. ${escapeHtml(opt)}
                                                    </li>
                                                `).join('')}
                                            </ol>
                                            <p class="mcq-final-answer">সঠিক উত্তর: ${escapeHtml(mcq.correctAnswer)}</p>
                                        </div>
                                    `;
                                });

                                weekDayContainerHtml += `
                                    <div class="day-container">
                                        <h5 class="day-header">Day ${day.dayNumber}</h5>
                                        ${dayMcqItemsHtml}
                                    </div>
                                `;
                            }
                        }
                        if (weekHasMcqs) {
                            monthWeekContainerHtml += `
                                <div class="week-container">
                                    <h4 class="week-header">${weekId.replace('week', 'Week ')}</h4>
                                    ${weekDayContainerHtml}
                                </div>
                            `;
                        }
                    }
                    if (monthHasMcqs) {
                        allMcqsHtml += `
                            <div class="month-container">
                                <h3 class="month-header">${monthName}</h3>
                                ${monthWeekContainerHtml}
                            </div>
                        `;
                    }
                }

                if (totalMcqCount === 0) {
                    masterMcqContent.innerHTML = '<p class="text-center text-gray-500 italic py-10">You have not added any MCQs to your study plans yet.</p>';
                } else {
                    masterMcqContent.innerHTML = allMcqsHtml;
                }
                totalMcqCountSpan.textContent = totalMcqCount;
                setSyncStatus("Synced", "green");

            } catch (error) {
                console.error("Error fetching all MCQs:", error);
                masterMcqContent.innerHTML = '<p class="text-center text-red-500 py-10">Could not load MCQs. Please try again.</p>';
                totalMcqCountSpan.textContent = "Error";
                setSyncStatus("Error", "red");
            }
        }

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
        // UPGRADED: Generates questions first to set timer
        async function startAggregatedMcqQuiz(quizType, monthId, weekId = null, dayIndex = null) {
            quizTitle.textContent = 'MCQ Quiz';
			currentMcqTarget = { quizType, monthId, weekId, dayIndex };
            closeModal('mcq-quiz-center-modal');
            quizModal.style.display = "block";
            quizMainScreen.classList.add('hidden');
            quizResultsScreen.classList.add('hidden');
            quizStartScreen.classList.remove('hidden');
            
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
                    userAnswer: null,
                    isCorrect: null
                }));
                
                const totalQuestions = currentQuizQuestions.length;
                const totalTimeInSeconds = totalQuestions * 36;
                
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

                // 2. CLEANUP: Remove ANY existing print iframe from previous attempts
                // This ensures we don't have duplicate frames, but we ONLY remove it 
                // when the user clicks print *again*, not while they are viewing the dialog.
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
                // Important: We keep it in the DOM so mobile can re-render on orientation change
                document.body.appendChild(iframe);

                // 4. Define Styles
                const styles = `
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Kalpurush:wght@400;700&display=swap');
                        
                        @page {
                            size: A4 landscape;
                            margin: 1cm;
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
                        
                        /* TABLE STYLES */
                        table.summary-print-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                        .summary-print-table thead th { background-color: #1f2937 !important; color: white !important; font-weight: bold; text-transform: uppercase; font-size: 11px; padding: 8px 10px; border: 1px solid #374151; text-align: center; }
                        .summary-print-table td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
                        .summary-print-table tr td[colspan] { background-color: #047857 !important; color: white !important; font-weight: bold; text-align: center; }
                        .summary-print-table tbody tr:nth-child(even) { background-color: #f9fafb; }
                        .summary-print-table td:first-child { font-weight: 600; text-align: center; color: #1f2937; }
                        .summary-print-table td:last-child { font-weight: 700; text-align: center; color: #4b5563; }

                        /* Clean up */
                        .summary-read-more-btn { display: none !important; }
                        .summary-cell-content { max-height: none !important; -webkit-line-clamp: unset !important; display: block !important; overflow: visible !important; }
                        .summary-cell-wrapper { display: block; }

                        /* VOCAB STYLES */
                        .vocab-section-title { color: #059669; text-align: center; margin-top: 30px; margin-bottom: 10px; font-size: 18px; font-weight: bold; page-break-before: always; }
                        .vocab-print-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 0; }
                        .vocab-print-table th, .vocab-print-table td { border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; vertical-align: middle; }
                        .vocab-main-header th { background-color: #1f2937 !important; color: white !important; text-align: center; font-weight: bold; }
                        .vocab-week-header td { background-color: #047857 !important; color: white !important; font-weight: bold; text-align: center; font-size: 13px; padding: 8px; }
                        .vocab-day-header td { background-color: #10b981 !important; color: white !important; font-weight: bold; text-align: center; }
                        .vocab-data-row:nth-child(even) { background-color: #f9fafb; }
                        .vocab-col-divider { border-right: 2px solid #9ca3af !important; }

                        /* FOOTER */
                        .print-footer { 
                            margin-top: auto; /* Push to bottom */
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
                // Wait 1 second for mobile to fully render the layout before triggering print
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
                        // CRITICAL FIX: We DO NOT remove the iframe here.
                        // We leave it in the DOM so if the user changes orientation, 
                        // the browser still has the source content to re-render.
                    }
                }, 1000);
            });
        }

        function getMonthNameFromIndex(index) {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return months[index] || "Unknown";
        }

        // Helper to generate the Colorful Vocab Table (CONTINUOUS - NO BREAKS)
        async function fetchAndBuildVocabHtml(monthId, weekId = null) {
            let html = `
                <table class="vocab-print-table">
                    <thead>
                        <tr class="vocab-main-header">
                            <th style="width: 15%;">Word</th>
                            <th style="width: 20%;">Meaning</th>
                            <th style="width: 15%;" class="vocab-col-divider">Synonym</th>
                            <th style="width: 15%;">Word</th>
                            <th style="width: 20%;">Meaning</th>
                            <th style="width: 15%;">Synonym</th>
                        </tr>
                    </thead>
                    <tbody>`;

            try {
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

                let hasVocab = false;

                for (const week of weeksToProcess) {
                    const weekData = week.data;
                    if (!weekData.days) continue;

                    let weekHasVocab = false;
                    let weekBufferHtml = ''; 

                    if (!weekId) {
                        weekBufferHtml += `<tr class="vocab-week-header"><td colspan="6">${week.id.replace('week', 'Week ')}</td></tr>`;
                    }

                    for (const day of weekData.days) {
                        let dayVocab = [];
                        day.rows?.forEach(row => {
                            if (row.subject?.toLowerCase() === 'vocabulary' && row.vocabData) {
                                const processed = preProcessVocab(row.vocabData);
                                dayVocab.push(...processed);
                            }
                        });

                        if (dayVocab.length > 0) {
                            hasVocab = true;
                            weekHasVocab = true;

                            if (weekBufferHtml) {
                                html += weekBufferHtml;
                                weekBufferHtml = ''; 
                            }

                            html += `<tr class="vocab-day-header"><td colspan="6">Day ${day.dayNumber}</td></tr>`;

                            for (let i = 0; i < dayVocab.length; i += 2) {
                                const v1 = dayVocab[i];
                                const v2 = dayVocab[i+1];

                                html += `<tr class="vocab-data-row">
                                    <td>${escapeHtml(v1.word)}</td>
                                    <td>${escapeHtml(v1.banglaMeaning)}</td>
                                    <td class="vocab-col-divider">${escapeHtml(v1.synonym || '-')}</td>
                                    
                                    <td>${v2 ? escapeHtml(v2.word) : ''}</td>
                                    <td>${v2 ? escapeHtml(v2.banglaMeaning) : ''}</td>
                                    <td>${v2 ? escapeHtml(v2.synonym || '-') : ''}</td>
                                </tr>`;
                            }
                        }
                    }
                }

                html += `</tbody></table>`;
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
		
		
	// --- START: POMODORO TIMER LOGIC ---
        
        const pomoWidget = document.getElementById('pomodoro-widget');
        const pomoIcon = document.getElementById('pomodoro-icon');
        const pomoTimerDisplay = document.getElementById('pomo-timer-display');
        const pomoStartBtn = document.getElementById('pomo-start-btn');
        const pomoResetBtn = document.getElementById('pomo-reset-btn');
        const pomoBtnFocus = document.getElementById('pomo-btn-focus');
        const pomoBtnBreak = document.getElementById('pomo-btn-break');
        const pomoProgressBar = document.getElementById('pomo-progress-bar');
        const pomoIconTime = document.getElementById('pomo-icon-time');

        let pomoInterval = null;
        let pomoTimeLeft = 25 * 60; // Seconds
        let pomoTotalTime = 25 * 60;
        let pomoIsRunning = false;
        let pomoMode = 'focus'; // 'focus' or 'break'

        // Initialize
        function initPomodoro() {
            updatePomoDisplay();
            
            // Buttons
            pomoStartBtn.addEventListener('click', togglePomoTimer);
            pomoResetBtn.addEventListener('click', resetPomoTimer);
            pomoBtnFocus.addEventListener('click', () => switchPomoMode('focus'));
            pomoBtnBreak.addEventListener('click', () => switchPomoMode('break'));
            
            // Minimize / Maximize
            document.getElementById('pomo-minimize-btn').addEventListener('click', () => {
                pomoWidget.classList.add('hidden');
                pomoIcon.classList.remove('hidden');
            });
            pomoIcon.addEventListener('click', () => {
                pomoIcon.classList.add('hidden');
                pomoWidget.classList.remove('hidden');
            });
        }

        function togglePomoTimer() {
            if (pomoIsRunning) {
                pausePomoTimer();
            } else {
                startPomoTimer();
            }
        }

        function startPomoTimer() {
            pomoIsRunning = true;
            pomoStartBtn.innerHTML = `<i class="fas fa-pause mr-1"></i> Pause`;
            pomoStartBtn.classList.replace('bg-emerald-500', 'bg-amber-500'); // Change color to amber
            
            pomoInterval = setInterval(() => {
                if (pomoTimeLeft > 0) {
                    pomoTimeLeft--;
                    updatePomoDisplay();
                } else {
                    pomoComplete();
                }
            }, 1000);
        }

        function pausePomoTimer() {
            pomoIsRunning = false;
            clearInterval(pomoInterval);
            pomoStartBtn.innerHTML = `<i class="fas fa-play mr-1"></i> Resume`;
            pomoStartBtn.classList.replace('bg-amber-500', 'bg-emerald-500');
        }

        function resetPomoTimer() {
            pausePomoTimer();
            pomoStartBtn.innerHTML = `<i class="fas fa-play mr-1"></i> Start`;
            pomoTimeLeft = (pomoMode === 'focus') ? 25 * 60 : 5 * 60;
            pomoTotalTime = pomoTimeLeft;
            updatePomoDisplay();
        }

        function switchPomoMode(mode) {
            pomoMode = mode;
            // Update Tabs
            if (mode === 'focus') {
                pomoBtnFocus.classList.add('active');
                pomoBtnBreak.classList.remove('active');
                pomoTimeLeft = 25 * 60;
            } else {
                pomoBtnBreak.classList.add('active');
                pomoBtnFocus.classList.remove('active');
                pomoTimeLeft = 5 * 60;
            }
            pomoTotalTime = pomoTimeLeft;
            pausePomoTimer(); // Auto-pause on switch
            pomoStartBtn.innerHTML = `<i class="fas fa-play mr-1"></i> Start`;
            updatePomoDisplay();
        }

        function updatePomoDisplay() {
            const minutes = Math.floor(pomoTimeLeft / 60);
            const seconds = pomoTimeLeft % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update Widget Text
            pomoTimerDisplay.textContent = timeString;
            
            // Update Progress Bar
            const progressPercent = ((pomoTotalTime - pomoTimeLeft) / pomoTotalTime) * 100;
            pomoProgressBar.style.width = `${progressPercent}%`;
            
            // Update Browser Tab Title (Optional UX improvement)
            if (pomoIsRunning) {
                document.title = `(${timeString}) Class Caddy`;
            } else {
                document.title = 'Class Caddy - My Study Plan';
            }

            // Update Minimized Icon Badge
            if (pomoIsRunning) {
                pomoIconTime.classList.remove('hidden');
                pomoIconTime.textContent = timeString;
            } else {
                pomoIconTime.classList.add('hidden');
            }
        }

        function pomoComplete() {
            pausePomoTimer();
            
            // Play Beep Sound
            // Using a standard reliable beep sound from Google's CDN or a simple generated one
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => console.log("Audio play failed (user didn't interact yet):", e));
            
            showCustomAlert(pomoMode === 'focus' ? "Focus session complete! Take a break." : "Break over! Back to work.", "success");
            
            // Auto-switch modes for convenience
            if (pomoMode === 'focus') {
                switchPomoMode('break');
            } else {
                switchPomoMode('focus');
            }
        }

        // Initialize on load
        if (document.getElementById('pomodoro-widget')) {
            initPomodoro();
        }

        // --- END: POMODORO TIMER LOGIC ---