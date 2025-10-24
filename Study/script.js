// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, setLogLevel } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

/* ----------------- CONFIG ----------------- */
const firebaseConfig = {
  apiKey: "AIzaSyAj7MDnrnzKUO73BXG0jeM-uBGrAH3XiAY",
  authDomain: "study-plan17.firebaseapp.com",
  projectId: "study-plan17",
  storageBucket: "study-plan17.firebasestorage.app",
  messagingSenderId: "394648483332",
  appId: "1:394648483332:web:a0b8f6adc9c8cad0e4e751",
  measurementId: "G-X9CFFJCM2F"
};

let app, auth, db, userId, dataDocRef, unsubscribeListener = null;
let isFirebaseReady = false, isDataLoaded = false;
let editingDay = null; // Stores the day currently being edited

// UI elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const syncIndicator = document.getElementById('sync-indicator');
const syncStatus = document.getElementById('sync-status');
const syncError = document.getElementById('sync-error');

function setSyncStatus(status, isError = false) {
    if (isError) {
        syncIndicator.classList.remove('bg-green-500', 'animate-pulse', 'bg-emerald-500', 'bg-yellow-500');
        syncIndicator.classList.add('bg-red-500');
        syncStatus.textContent = status;
        syncError.textContent = status;
        syncError.classList.remove('hidden');
    } else if (status === 'synced') {
        syncIndicator.classList.remove('bg-gray-400', 'animate-pulse', 'bg-yellow-500', 'bg-red-500');
        syncIndicator.classList.add('bg-emerald-500');
        syncStatus.textContent = "Synced";
        syncError.classList.add('hidden');
    } else if (status === 'saving') {
        syncIndicator.classList.remove('bg-emerald-500', 'bg-red-500');
        syncIndicator.classList.add('bg-yellow-500', 'animate-pulse');
        syncStatus.textContent = "Saving...";
    } else {
        syncIndicator.classList.add('bg-gray-400', 'animate-pulse');
        syncStatus.textContent = status || "Connecting...";
    }
}

function showLoggedOutUI() {
    if (unsubscribeListener) { unsubscribeListener(); unsubscribeListener = null; }
    userInfo.classList.add('hidden'); loginBtn.classList.remove('hidden');
    setSyncStatus("Waiting for login...");
    syncIndicator.classList.remove('bg-emerald-500', 'bg-red-500', 'bg-yellow-500');
    syncIndicator.classList.add('bg-gray-400');
    clearLocalData();
    isDataLoaded = false;
    editingDay = null; // Ensure editing state is reset
    buildUI(); // Rebuild UI to clear any editing states
}

function showLoggedInUI(user) {
    loginBtn.classList.add('hidden'); userInfo.classList.remove('hidden');
    userName.textContent = user.displayName; userEmail.textContent = user.email;
    setSyncStatus("Connecting...");
}

async function signInWithGoogle() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
        setSyncStatus("Logging in...");
        await signInWithPopup(auth, provider);
    } catch (err) {
        console.error(err); setSyncStatus(err.message, true);
    }
}

async function signOutUser() {
    if (!auth) return;
    try { await signOut(auth); } catch (err) { console.error(err); setSyncStatus(err.message, true); }
}

async function initFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        setLogLevel('error');
        isFirebaseReady = true;

        onAuthStateChanged(auth, async user => {
            if (user) {
                userId = user.uid; showLoggedInUI(user);
                const dataPath = `/studyPlan/users/${userId}/progress`;
                dataDocRef = doc(db, dataPath);
                listenForDataChanges();
            } else {
                userId = null; dataDocRef = null; showLoggedOutUI();
            }
        });
    } catch (err) {
        console.error("Firebase init error", err); setSyncStatus(err.message, true);
    }
}

/* ------------- APP DATA & UI BUILD ------------- */
let dailyPlanData = [
    { day: 'Day-1', subject: 'Subject 1', topic: '' },
    { day: 'Day-1', subject: 'Subject 2', topic: '' },
    { day: 'Day-1', subject: 'Vocabulary', topic: '' },
    { day: 'Day-1', subject: 'Subject 4', topic: '' },
    { day: 'Day-1', subject: 'Basic View', topic: '' }, // This one will have the edit button
    { day: 'Day-2', subject: 'Subject 1', topic: '' },
    { day: 'Day-2', subject: 'Subject 2', topic: '' },
    { day: 'Day-2', subject: 'Vocabulary', topic: '' },
    { day: 'Day-2', subject: 'Subject 4', topic: '' },
    { day: 'Day-2', subject: 'Basic View', topic: '' },
    { day: 'Day-3', subject: 'Subject 1', topic: '' },
    { day: 'Day-3', subject: 'Subject 2', topic: '' },
    { day: 'Day-3', subject: 'Vocabulary', topic: '' },
    { day: 'Day-3', subject: 'Subject 4', topic: '' },
    { day: 'Day-3', subject: 'Basic View', topic: '' },
    { day: 'Day-4', subject: 'Subject 1', topic: '' },
    { day: 'Day-4', subject: 'Subject 2', topic: '' },
    { day: 'Day-4', subject: 'Vocabulary', topic: '' },
    { day: 'Day-4', subject: 'Subject 4', topic: '' },
    { day: 'Day-4', subject: 'Basic View', topic: '' },
    { day: 'Day-5', subject: 'Subject 1', topic: '' },
    { day: 'Day-5', subject: 'Subject 2', topic: '' },
    { day: 'Day-5', subject: 'Vocabulary', topic: '' },
    { day: 'Day-5', subject: 'Subject 4', topic: '' },
    { day: 'Day-5', subject: 'Basic View', topic: '' },
    { day: 'Day-6', subject: 'Subject 1', topic: '' },
    { day: 'Day-6', subject: 'Subject 2', topic: '' },
    { day: 'Day-6', subject: 'Vocabulary', topic: '' },
    { day: 'Day-6', subject: 'Subject 4', topic: '' },
    { day: 'Day-6', subject: 'Basic View', topic: '' },
    { day: 'Day-7', subject: 'Subject 1', topic: '' },
    { day: 'Day-7', subject: 'Subject 2', topic: '' },
    { day: 'Day-7', subject: 'Vocabulary', topic: '' },
    { day: 'Day-7', subject: 'Subject 4', topic: '' },
    { day: 'Day-7', subject: 'Basic View', topic: '' },
];
let initialDailyPlanData = JSON.parse(JSON.stringify(dailyPlanData));

let vocabStories = {};
let initialVocabStories = {};

const taskWeights = {
    'Vocabulary': 10 / 7,
    'Basic View': 0, // This is just a placeholder for the edit button, doesn't represent a task to complete
    'DEFAULT_SUBJECT_WEIGHT': 5 / 7
};
let maxWeight = 0;
const progressLabel = document.getElementById('weekly-progress-label');
const progressBar = document.getElementById('weekly-progress-bar');

window.updateWeeklyProgress = function () {
    let currentWeight = 0;
    const allCheckboxes = document.querySelectorAll('.task-checkbox');
    const checkedTasks = new Set(); // Use a Set to store unique day-subject pairs
    allCheckboxes.forEach(cb => {
        const uniqueId = `${cb.dataset.day}-${cb.dataset.subject}`;
        // Only count if it's checked and if we haven't already counted this specific day-subject task
        if (cb.checked && !checkedTasks.has(uniqueId)) {
            const subject = cb.dataset.subject;
            // Only add weight if the subject is not "Basic View"
            if (subject !== 'Basic View') {
                currentWeight += taskWeights[subject] || taskWeights['DEFAULT_SUBJECT_WEIGHT'];
            }
            checkedTasks.add(uniqueId);
        }
    });

    const percentage = (maxWeight > 0) ? (currentWeight / maxWeight) * 100 : 0;
    if (progressLabel) progressLabel.textContent = `Weekly Progress: ${percentage.toFixed(0)}%`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
}

/* ---------- Helpers for Vocab UI ---------- */
function createVocabElementFromPair(pair) {
    const parts = pair.split(',');
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        const eng = parts[0].trim();
        const ban = parts.slice(1).join(',').trim().replace('।', '');

        const container = document.createElement('div');
        container.classList.add('vocab-item');
        container.setAttribute('tabindex', '0');
        container.addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelectorAll('.vocab-item.active').forEach(it => { if (it !== this) it.classList.remove('active'); });
            this.classList.toggle('active');
        });
        const engSpan = document.createElement('span'); engSpan.classList.add('vocab-word'); engSpan.textContent = eng;
        const banSpan = document.createElement('span'); banSpan.classList.add('vocab-meaning'); banSpan.textContent = ban;

        container.appendChild(engSpan);
        container.appendChild(banSpan);

        return container;
    } else if (pair.trim()) {
        const span = document.createElement('span'); span.textContent = pair.trim(); return span;
    }
    return null;
}

// Build UI
const tableBody = document.getElementById('daily-plan-body');
const mobileCardsContainer = document.getElementById('daily-plan-cards');

function buildUI() {
    tableBody.innerHTML = '';
    mobileCardsContainer.innerHTML = '';
    let currentDayInTable = '';
    let currentDayInCards = '';
    maxWeight = 0; // Reset maxWeight calculation

    // Calculate maxWeight based on all subjects *except* "Basic View"
    dailyPlanData.forEach(item => {
        if (item.subject !== 'Basic View') { // "Basic View" is for controls, not a task itself
            maxWeight += taskWeights[item.subject] || taskWeights['DEFAULT_SUBJECT_WEIGHT'];
        }
    });

    dailyPlanData.forEach((item, index) => {
        const isEditingCurrentDay = (editingDay === item.day);
        const isFirstItemOfDay = (item.day !== currentDayInTable);

        // --- Desktop Table Row ---
        const row = document.createElement('tr');
        row.classList.add('task-item');
        row.setAttribute('data-day', item.day);
        row.setAttribute('data-subject', item.subject);

        const dayCell = document.createElement('td');
        dayCell.classList.add('px-6', 'py-4', 'text-sm', 'font-medium', 'text-gray-900', 'align-top');

        if (isFirstItemOfDay) {
            row.classList.add('day-group-start');
            const dayText = document.createElement('span');
            dayText.textContent = item.day;
            dayCell.appendChild(dayText);

            // Date input for completion
            const dateInputDiv = document.createElement('div');
            dateInputDiv.classList.add('date-input-desktop', 'mt-2');
            dateInputDiv.setAttribute('data-day-input', item.day);
            dateInputDiv.style.display = 'none'; // Hidden by default
            const dateInputId = `date-${item.day}`;
            dateInputDiv.innerHTML = `
                <div class="flex flex-col gap-1">
                    <label for="${dateInputId}" class="text-xs font-medium text-gray-600">Completion Date:</label>
                    <input type="text" id="${dateInputId}" class="form-input p-1 border border-gray-300 rounded-md shadow-sm text-sm w-full max-w-xs editable-field" placeholder="e.g., 24/10/25">
                </div>
            `;
            dateInputDiv.querySelector('input').addEventListener('input', onInputChange);
            dayCell.appendChild(dateInputDiv);
            currentDayInTable = item.day;
        }
        row.appendChild(dayCell);

        const subjectCell = document.createElement('td');
        subjectCell.classList.add('px-6', 'py-4', 'text-sm', 'text-gray-500', 'font-medium', 'align-top');

        // Subject Input
        const subjectInput = document.createElement('input');
        subjectInput.type = 'text';
        subjectInput.classList.add('editable-field');
        subjectInput.value = item.subject;
        subjectInput.setAttribute('data-field-type', 'subject');
        subjectInput.setAttribute('data-day', item.day);
        subjectInput.setAttribute('data-old-subject', item.subject); // Store original subject for lookup during save
        if (!isEditingCurrentDay) subjectInput.style.display = 'none';
        subjectCell.appendChild(subjectInput);

        // Subject Display
        const subjectDisplaySpan = document.createElement('span');
        subjectDisplaySpan.classList.add('font-medium', 'text-gray-700');
        subjectDisplaySpan.textContent = item.subject;
        if (isEditingCurrentDay) subjectDisplaySpan.style.display = 'none';
        subjectCell.appendChild(subjectDisplaySpan);

        row.appendChild(subjectCell);

        const topicCell = document.createElement('td');
        topicCell.classList.add('px-6', 'py-4', 'text-sm', 'text-gray-600', 'align-top', 'whitespace-normal', 'break-words');

        const topicInputTag = (item.subject === 'Vocabulary' || item.subject === 'Newspaper' || item.subject === 'Basic View') ? 'textarea' : 'input';
        const topicInput = document.createElement(topicInputTag);
        if (topicInputTag === 'input') topicInput.type = 'text';
        topicInput.classList.add('editable-field');
        topicInput.value = item.topic || '';
        if (item.subject === 'Vocabulary') topicInput.placeholder = 'Enter vocabulary as: Word, Meaning; AnotherWord, Meaning; ...';
        topicInput.setAttribute('data-field-type', 'topic');
        topicInput.setAttribute('data-day', item.day);
        topicInput.setAttribute('data-subject', item.subject);
        topicInput.setAttribute('data-old-subject', item.subject); // Store original subject for topic changes too
        if (!isEditingCurrentDay) topicInput.style.display = 'none';

        // Display area for non-editing mode
        const displaySpan = document.createElement('div');
        displaySpan.classList.add('text-sm', 'break-words', 'whitespace-normal');
        if (isEditingCurrentDay) displaySpan.style.display = 'none';

        if (item.subject === 'Vocabulary' && item.topic && !isEditingCurrentDay) {
            const wrapper = document.createElement('div'); wrapper.classList.add('flex', 'flex-wrap', 'gap-2', 'py-1');
            const pairs = item.topic.split(';').filter(p => p.trim());
            pairs.forEach(p => {
                const el = createVocabElementFromPair(p);
                if (el) wrapper.appendChild(el);
            });
            displaySpan.appendChild(wrapper);
            if (pairs.length > 0 && vocabStories[item.day]) {
                const storyBtn = document.createElement('button'); storyBtn.textContent = 'Read story'; storyBtn.classList.add('read-story-btn'); storyBtn.setAttribute('data-day', item.day);
                displaySpan.appendChild(storyBtn);
            }
        } else if (!isEditingCurrentDay) {
            displaySpan.textContent = item.topic || '-';
        }

        topicCell.appendChild(topicInput);
        topicCell.appendChild(displaySpan);

        // Story field is only shown on the "Basic View" task for a day
        if (item.subject === 'Basic View') {
            const storyFieldWrapper = document.createElement('div');
            storyFieldWrapper.classList.add('mt-4');
            const storyLabel = document.createElement('label'); storyLabel.textContent = 'Vocabulary Story (optional)'; storyLabel.classList.add('block', 'text-sm', 'font-medium', 'text-gray-700', 'mb-1');
            const storyArea = document.createElement('textarea');
            storyArea.classList.add('editable-field');
            storyArea.rows = 4;
            storyArea.placeholder = 'HTML allowed (e.g., use <strong>word</strong>)';
            storyArea.value = vocabStories[item.day] || '';
            storyArea.setAttribute('data-field-type', 'story');
            storyArea.setAttribute('data-day', item.day);
            if (!isEditingCurrentDay) storyArea.style.display = 'none'; // Hide story area if not editing
            storyFieldWrapper.appendChild(storyLabel);
            storyFieldWrapper.appendChild(storyArea);
            topicCell.appendChild(storyFieldWrapper);
        }
        row.appendChild(topicCell);

        const actionsCell = document.createElement('td');
        actionsCell.classList.add('px-6', 'py-4', 'text-sm', 'text-gray-500', 'align-top', 'flex', 'items-start', 'gap-2');

        // Checkbox - only for actual tasks, not "Basic View"
        if (item.subject !== 'Basic View') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('task-checkbox');
            checkbox.setAttribute('data-day', item.day);
            checkbox.setAttribute('data-subject', item.subject);
            checkbox.addEventListener('change', onInputChange);
            actionsCell.appendChild(checkbox);
        }

        // Edit/Save/Cancel buttons - only on the "Basic View" task for the day
        if (item.subject === 'Basic View') {
            const editButtonContainer = document.createElement('div');
            editButtonContainer.classList.add('edit-buttons', 'flex', 'flex-col', 'gap-2', 'ml-2');
            editButtonContainer.style.marginTop = item.subject !== 'Basic View' ? 'auto' : '0'; // Adjust margin for alignment

            if (isEditingCurrentDay) {
                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'Save';
                saveBtn.classList.add('px-3', 'py-1', 'rounded-md', 'font-medium', 'text-xs', 'shadow-sm', 'transition', 'bg-emerald-600', 'text-white', 'hover:bg-emerald-700');
                saveBtn.setAttribute('data-day', item.day);
                saveBtn.addEventListener('click', saveDayEdits);
                editButtonContainer.appendChild(saveBtn);

                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.classList.add('px-3', 'py-1', 'rounded-md', 'border', 'border-gray-300', 'text-xs', 'text-gray-700', 'hover:bg-gray-100', 'shadow-sm');
                cancelBtn.setAttribute('data-day', item.day);
                cancelBtn.addEventListener('click', cancelDayEdits);
                editButtonContainer.appendChild(cancelBtn);
            } else {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.classList.add('px-3', 'py-1', 'rounded-md', 'border', 'border-gray-300', 'text-xs', 'text-gray-700', 'bg-white', 'hover:bg-gray-50', 'shadow-sm', 'transition');
                editBtn.setAttribute('data-day', item.day);
                editBtn.addEventListener('click', toggleDayEditMode);
                editButtonContainer.appendChild(editBtn);
            }
            actionsCell.appendChild(editButtonContainer);
        }

        row.appendChild(actionsCell);
        tableBody.appendChild(row);

        // --- Mobile Card ---
        const isFirstItemOfDayMobile = (item.day !== currentDayInCards);
        if (item.subject !== 'Basic View' || isFirstItemOfDayMobile) { // Only create card for 'Basic View' if it's the first in a day group
            const card = document.createElement('div');
            card.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow', 'card-item');
            card.setAttribute('data-day', item.day);

            let headerHTML = '';
            let dateInputMobileHTML = '';
            const dateInputMobileId = `date-mobile-${item.day}`;
            if (isFirstItemOfDayMobile) {
                headerHTML = `<h3 class="font-bold text-lg text-gray-800 mb-2">${item.day}</h3>`;
                dateInputMobileHTML = `
                    <div class="date-input-mobile mt-2 mb-3 p-3 bg-emerald-50 rounded-md" data-day-input="${item.day}" style="display:none;">
                        <div class="flex items-center gap-2">
                            <label for="${dateInputMobileId}" class="text-sm font-medium text-gray-700">Completion Date:</label>
                            <input type="text" id="${dateInputMobileId}" class="form-input p-1 border border-gray-300 rounded-md shadow-sm text-sm w-full editable-field" placeholder="e.g., 24/10/25">
                        </div>
                    </div>
                `;
                currentDayInCards = item.day;
            }

            let subjectContentHTML = `
                <p class="font-medium text-gray-700">
                    <input type="text" class="editable-field ${isEditingCurrentDay ? '' : 'hidden'}" value="${item.subject}" data-field-type="subject" data-day="${item.day}" data-old-subject="${item.subject}">
                    <span class="font-medium text-gray-700 ${isEditingCurrentDay ? 'hidden' : ''}">${item.subject}</span>
                </p>
            `;

            const cardTopicInputType = (item.subject === 'Vocabulary' || item.subject === 'Newspaper' || item.subject === 'Basic View') ? 'textarea' : 'input';
            let topicInputHTML = `
                <${cardTopicInputType} class="editable-field ${isEditingCurrentDay ? '' : 'hidden'}" rows="${cardTopicInputType === 'textarea' ? '2' : '1'}" placeholder="${item.subject === 'Vocabulary' ? 'Enter vocabulary as: Word, Meaning; AnotherWord, Meaning; ...' : 'Enter topic'}" data-field-type="topic" data-day="${item.day}" data-subject="${item.subject}" data-old-subject="${item.subject}">${item.topic || ''}</${cardTopicInputType}>
            `;

            let topicDisplayHTML = `<div class="text-sm break-words ${isEditingCurrentDay ? 'hidden' : ''}" id="topic-mobile-${item.day}-${item.subject}-display-content">`;
            if (item.subject === 'Vocabulary' && item.topic && !isEditingCurrentDay) {
                const wrapper = document.createElement('div'); wrapper.classList.add('flex', 'flex-wrap', 'gap-2', 'py-1');
                const pairs = item.topic.split(';').filter(p => p.trim());
                pairs.forEach(p => {
                    const el = createVocabElementFromPair(p);
                    if (el) topicDisplayHTML += el.outerHTML;
                });
                topicDisplayHTML += '</div>';
                if (pairs.length > 0 && vocabStories[item.day]) topicDisplayHTML += `<button class="read-story-btn" data-day="${item.day}">Read story</button>`;
            } else {
                topicDisplayHTML += `<span>${item.topic || '-'}</span>`;
            }
            topicDisplayHTML += `</div>`;

            let storyMobileContentHTML = '';
            if (item.subject === 'Basic View') {
                storyMobileContentHTML = `
                    <div class="mt-4 story-field-wrapper ${isEditingCurrentDay ? '' : 'hidden'}">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Vocabulary Story (optional)</label>
                        <textarea class="editable-field" rows="4" placeholder="HTML allowed (e.g., use &lt;strong&gt;word&lt;/strong&gt;)" data-field-type="story" data-day="${item.day}">${vocabStories[item.day] || ''}</textarea>
                    </div>
                `;
            }

            let editButtonsMobileHTML = '';
            if (item.subject === 'Basic View') {
                editButtonsMobileHTML = `
                    <div class="flex flex-col gap-2 mt-4">
                        <button class="px-3 py-1 rounded-md font-medium text-xs shadow-sm transition bg-emerald-600 text-white hover:bg-emerald-700 ${isEditingCurrentDay ? '' : 'hidden'}" data-day="${item.day}" onclick="saveDayEdits(event)">Save</button>
                        <button class="px-3 py-1 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 shadow-sm ${isEditingCurrentDay ? '' : 'hidden'}" data-day="${item.day}" onclick="cancelDayEdits(event)">Cancel</button>
                        <button class="px-3 py-1 rounded-md border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition ${isEditingCurrentDay ? 'hidden' : ''}" data-day="${item.day}" onclick="toggleDayEditMode(event)">Edit</button>
                    </div>
                `;
            }

            card.innerHTML = `
                ${headerHTML}
                ${dateInputMobileHTML}
                <div class="flex items-start">
                    ${item.subject !== 'Basic View' ? `<input type="checkbox" class="task-checkbox mt-1" data-day="${item.day}" data-subject="${item.subject}">` : ''}
                    <div class="ml-2 flex-1 min-w-0">
                        ${subjectContentHTML}
                        ${topicInputHTML}
                        ${topicDisplayHTML}
                        ${storyMobileContentHTML}
                        ${editButtonsMobileHTML}
                    </div>
                </div>
            `;

            // Add event listeners to newly created elements within the card
            if (item.subject !== 'Basic View') {
                card.querySelector('.task-checkbox').addEventListener('change', onInputChange);
            }
            if (card.querySelector(`#${dateInputMobileId}`)) {
                card.querySelector(`#${dateInputMobileId}`).addEventListener('input', onInputChange);
            }

            // Attach vocab click toggles for mobile items that were put as innerHTML
            card.querySelectorAll('.vocab-item').forEach(vc => {
                vc.addEventListener('click', function (ev) { ev.stopPropagation(); document.querySelectorAll('.vocab-item.active').forEach(i => { if (i !== this) i.classList.remove('active'); }); this.classList.toggle('active'); });
            });

            mobileCardsContainer.appendChild(card);
        }
    });

    // global click to close vocab tooltips
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.vocab-item')) {
            document.querySelectorAll('.vocab-item.active').forEach(v => v.classList.remove('active'));
        }
    });

    updateWeeklyProgress();
}

// Input change handler (checkboxes & date inputs)
function onInputChange(event) {
    if (!isDataLoaded) return;

    const el = event.target;

    if (el.classList.contains('task-checkbox')) {
        const day = el.dataset.day;
        const subject = el.dataset.subject;
        // Sync checkboxes for the same day-subject pair across desktop and mobile
        document.querySelectorAll(`.task-checkbox[data-day="${day}"][data-subject="${subject}"]`).forEach(cb => {
            cb.checked = el.checked;
            const taskItem = cb.closest('.task-item, .card-item');
            if (taskItem) taskItem.classList.toggle('completed', el.checked);
        });
        checkDayCompletion(day);
        debouncedSaveData(); // Save checkbox state immediately
    } else if (el.tagName === 'INPUT' && el.type === 'text' && (el.id.startsWith('date-') || el.id.startsWith('date-mobile-'))) {
        const day = el.id.replace('date-', '').replace('date-mobile-', '');
        document.querySelectorAll(`input[id^="date-"][id$="${day}"]`).forEach(input => { // Selects both desktop and mobile date inputs
            input.value = el.value;
        });
        debouncedSaveData(); // Save date immediately
    } else if (el.closest('.monthly-targets')) {
        // DebouncedSaveData is called directly via onblur in HTML for monthly targets
    }
    updateWeeklyProgress();
}

// Check if all tasks (excluding "Basic View") for a day are completed to show date input
window.checkDayCompletion = function (day) {
    const allCheckboxesForDay = document.querySelectorAll(`.task-checkbox[data-day="${day}"]`);
    if (allCheckboxesForDay.length === 0) return;

    let allRelevantTasksChecked = true;
    const subjectsInDay = new Set(Array.from(allCheckboxesForDay).map(cb => cb.dataset.subject));

    subjectsInDay.forEach(subject => {
        if (subject !== 'Basic View') { // Exclude "Basic View" from completion check
            const boxes = document.querySelectorAll(`.task-checkbox[data-day="${day}"][data-subject="${subject}"]`);
            const isSubjectChecked = Array.from(boxes).some(cb => cb.checked);
            if (!isSubjectChecked) {
                allRelevantTasksChecked = false;
            }
        }
    });

    const desktopInput = document.querySelector(`.date-input-desktop[data-day-input="${day}"]`);
    const mobileInput = document.querySelector(`.date-input-mobile[data-day-input="${day}"]`);

    if (allRelevantTasksChecked) {
        if (desktopInput) desktopInput.style.display = 'block';
        if (mobileInput) mobileInput.style.display = 'block';
    } else {
        if (desktopInput) desktopInput.style.display = 'none';
        if (mobileInput) mobileInput.style.display = 'none';
    }
}

/* ----------------- Inline Editing Logic ----------------- */

// Toggles the editing mode for a specific day
window.toggleDayEditMode = function (event) {
    if (!isFirebaseReady || !userId) {
        alert("Please sign in to edit your study plan.");
        return;
    }

    const dayToEdit = event.target.dataset.day;

    // If another day is being edited, prevent simultaneous edits
    if (editingDay && editingDay !== dayToEdit) {
        alert(`Please save or cancel edits for ${editingDay} before editing another day.`);
        return;
    }

    editingDay = (editingDay === dayToEdit) ? null : dayToEdit; // Toggle editing state

    // Capture current state as initial for potential "cancel" operation
    if (editingDay) {
        initialDailyPlanData = JSON.parse(JSON.stringify(dailyPlanData));
        initialVocabStories = JSON.parse(JSON.stringify(vocabStories));
    }

    buildUI(); // Rebuild UI to reflect editing state for the selected day
    if (editingDay) {
        // After rebuilding, focus on the first editable field of the selected day
        const firstEditableField = document.querySelector(`[data-day="${editingDay}"] .editable-field:not([data-field-type="story"])`);
        if (firstEditableField) {
            firstEditableField.focus();
        }
    }
}

// Saves the edits for a day
window.saveDayEdits = function (event) {
    const dayToSave = event.target.dataset.day;
    if (dayToSave !== editingDay) {
        console.warn("Attempted to save a day not in editing mode:", dayToSave);
        return;
    }

    const collectedNewSubjects = {}; // { oldSubject: newSubjectName, ... }
    const collectedNewTopics = {};   // { oldSubject: newTopicContent, ... }
    let newStoryContent = null;

    // Iterate over all editable fields for the specific day to collect values
    document.querySelectorAll(`[data-day="${dayToSave}"] .editable-field`).forEach(field => {
        const fieldType = field.dataset.fieldType;
        const originalSubject = field.dataset.oldSubject; // This is crucial for matching!

        if (fieldType === 'subject' && originalSubject) {
            collectedNewSubjects[originalSubject] = field.value.trim();
        } else if (fieldType === 'topic' && originalSubject) {
            collectedNewTopics[originalSubject] = field.value.trim();
        } else if (fieldType === 'story') {
            newStoryContent = field.value.trim();
        }
    });

    // --- Apply changes to dailyPlanData (in-memory) ---
    const updatedDailyPlanData = dailyPlanData.map(item => {
        if (item.day === dayToSave) {
            const oldSubject = item.subject; // The subject name of this specific item in the array

            const updatedSubjectName = collectedNewSubjects[oldSubject] !== undefined
                                       ? collectedNewSubjects[oldSubject]
                                       : oldSubject;

            const updatedTopic = collectedNewTopics[oldSubject] !== undefined
                                 ? collectedNewTopics[oldSubject]
                                 : item.topic;

            return {
                day: item.day,
                subject: updatedSubjectName,
                topic: updatedTopic
            };
        }
        return item; // Return unchanged item for other days
    });
    dailyPlanData = updatedDailyPlanData;

    // --- Apply changes to vocabStories (in-memory) ---
    if (newStoryContent !== null) {
        if (newStoryContent) {
            vocabStories[dayToSave] = newStoryContent;
        } else {
            delete vocabStories[dayToSave];
        }
    }

    // Exit editing mode
    editingDay = null;

    // Rebuild UI to reflect all updated in-memory data
    buildUI();

    // Trigger save to Firestore with the latest in-memory data
    debouncedSaveData();
    console.log("Save initiated for day:", dayToSave, "Current dailyPlanData:", dailyPlanData, "Current vocabStories:", vocabStories);
}


// Cancels the edits for a day
window.cancelDayEdits = function (event) {
    const dayToCancel = event.target.dataset.day;
    if (dayToCancel !== editingDay) return;

    // Restore original data from the snapshot taken when editing started
    dailyPlanData = JSON.parse(JSON.stringify(initialDailyPlanData));
    vocabStories = JSON.parse(JSON.stringify(initialVocabStories));

    editingDay = null; // Exit editing mode
    buildUI(); // Rebuild UI to show original, non-editable content
    // No Firestore save needed for cancel
}

/* ------------- Persistence: Save & Load ------------- */

let saveTimeout;
window.debouncedSaveData = function () { // Made global for monthly targets onblur
    if (!isDataLoaded || !isFirebaseReady || !userId) return;
    clearTimeout(saveTimeout);
    setSyncStatus('saving');
    saveTimeout = setTimeout(() => { saveDataToFirestore(); }, 1200);
}

async function saveDataToFirestore() {
    if (!dataDocRef) { console.warn('No doc ref to save'); return; }
    const progressData = {};

    // 1. checkbox states
    document.querySelectorAll('.task-checkbox').forEach(cb => {
        const day = cb.dataset.day; const subj = cb.dataset.subject;
        const key = `${day}-${subj}-checked`;
        if (cb.checked) progressData[key] = cb.checked;
        // No explicit 'false' saved, if not present or false, it's considered false
    });

    // 2. date inputs
    // We get the date inputs from the current UI state
    document.querySelectorAll('input[id^="date-"]').forEach(input => {
        const id = input.id || '';
        const day = id.replace('date-', '').replace('date-mobile-', '');
        if (!day) return;
        const key = `${day}-date`;
        // Only save if unique (e.g., from desktop or mobile, but only once per day)
        if (input.value && !progressData[key]) progressData[key] = input.value;
    });

    // 3. topics per day-subject and subject names (from dailyPlanData in memory)
    dailyPlanData.forEach(item => {
        const topicKey = `${item.day}-${item.subject}-topic`;
        if (item.topic) progressData[topicKey] = item.topic;

        // Save the current subject name itself if it's been edited.
        // We can create a distinct key for subject name if needed, or rely on mapping during rebuild.
        // For simplicity, `dailyPlanData` itself holds the latest subject names, which is used to rebuild.
        // If you need to store original vs. edited subject names explicitly, you'd add more keys.
    });

    // 4. stories per day
    Object.keys(vocabStories).forEach(day => {
        const key = `${day}-story`;
        if (vocabStories[day]) progressData[key] = vocabStories[day];
    });

    // 5. Monthly targets (read directly from contenteditable fields)
    document.querySelectorAll('.monthly-targets .editable-field[contenteditable="true"]').forEach(field => {
        const targetKey = field.dataset.target;
        progressData[targetKey] = field.textContent.trim();
    });

    try {
        await setDoc(dataDocRef, progressData, { merge: true });
        setSyncStatus('synced');
        console.log('Saved progress:', progressData);
    } catch (err) {
        console.error('Save error', err); setSyncStatus(err.message, true);
    }
}

function listenForDataChanges() {
    if (!dataDocRef) return;
    if (unsubscribeListener) unsubscribeListener();
    unsubscribeListener = onSnapshot(dataDocRef, docSnap => {
        let progressData = {};
        if (docSnap.exists()) progressData = docSnap.data();
        console.log('Loaded data from firestore', progressData);
        applyLoadedData(progressData);
        setSyncStatus('synced');
        isDataLoaded = true;
    }, err => {
        console.error('Snapshot error', err); setSyncStatus(err.message, true);
    });
}

function clearLocalData() {
    // clear checkboxes, date inputs and remove "completed" classes
    document.querySelectorAll('.task-checkbox').forEach(cb => { cb.checked = false; const ti = cb.closest('.task-item, .card-item'); if (ti) ti.classList.remove('completed'); });
    document.querySelectorAll('.date-input-desktop input, .date-input-mobile input').forEach(inp => inp.value = '');

    // Reset dailyPlanData and vocabStories to their initial state (empty topics/stories)
    dailyPlanData = JSON.parse(JSON.stringify(initialDailyPlanData));
    vocabStories = {}; // Clear all stories
    buildUI(); // Rebuild UI to reflect cleared data
    updateWeeklyProgress();
}

function applyLoadedData(progressData) {
    // Reset in-memory data to initial structure, then apply loaded topics
    dailyPlanData = JSON.parse(JSON.stringify(initialDailyPlanData)); // Reset topics to default before applying loaded ones
    vocabStories = {}; // Clear all stories before applying loaded ones

    // 1) Apply topics (day-subject) into dailyPlanData. This handles edited subject names too.
    const tempDailyPlan = JSON.parse(JSON.stringify(initialDailyPlanData));
    dailyPlanData = tempDailyPlan.map(item => {
        const key = `${item.day}-${item.subject}-topic`; // This key uses the original subject name for lookup
        if (progressData[key] !== undefined) {
            return {
                day: item.day,
                subject: item.subject, // Retain original subject name for now
                topic: progressData[key]
            };
        }
        return item;
    });

    // IMPORTANT: If subjects themselves could be edited *and saved uniquely*,
    // you'd need a more complex structure in Firestore (e.g., an array of objects
    // per day rather than flat keys) to map original subjects to new ones.
    // Given the current flat Firestore structure, we assume subject names are fixed
    // unless they are explicitly editable fields in the UI, and if so,
    // `saveDayEdits` handles updating `dailyPlanData`'s subject name for the next `buildUI`.
    // The `applyLoadedData` should then primarily populate `item.topic` based on existing `item.subject`.

    // 2) Apply stories
    Object.keys(progressData).forEach(key => {
        if (key.endsWith('-story')) {
            const day = key.replace('-story', '');
            vocabStories[day] = progressData[key];
        }
    });

    // Now that in-memory data is updated, rebuild the UI
    buildUI();

    // 0. Apply monthly targets
    document.querySelectorAll('.monthly-targets .editable-field[contenteditable="true"]').forEach(field => {
        const targetKey = field.dataset.target;
        if (progressData[targetKey] !== undefined) {
            field.textContent = progressData[targetKey];
        } else {
            field.textContent = 'Enter target here...'; // Reset if not in loaded data
        }
    });

    // 3) Apply checkbox states to the newly built UI
    document.querySelectorAll('.task-checkbox').forEach(cb => {
        const day = cb.dataset.day; const subj = cb.dataset.subject;
        const key = `${day}-${subj}-checked`;
        const val = progressData[key];
        cb.checked = !!val;
        const taskItem = cb.closest('.task-item, .card-item');
        if (taskItem) taskItem.classList.toggle('completed', !!val);
    });

    // 4) Apply date inputs to the newly built UI
    document.querySelectorAll('input[id^="date-"]').forEach(inp => { // Selects all date inputs
        const id = inp.id || '';
        const day = id.replace('date-', '').replace('date-mobile-', '');
        const key = `${day}-date`;
        inp.value = progressData[key] || '';
        // If a date is present, ensure the date input is visible
        if (inp.value) {
            const dateInputDiv = inp.closest('.date-input-desktop, .date-input-mobile');
            if (dateInputDiv) dateInputDiv.style.display = 'block';
        }
    });

    // After all applied, check day completions and progress
    const allDays = new Set(dailyPlanData.map(it => it.day));
    allDays.forEach(d => checkDayCompletion(d));
    updateWeeklyProgress();
}

/* ----------------- Story Modal handling ----------------- */
const storyModal = document.getElementById('story-modal');
const storyOverlay = document.getElementById('story-overlay');
const storyCloseBtn = document.getElementById('story-close-btn');
const storyContent = document.getElementById('story-content');
const storyTitle = document.getElementById('story-title');

function showStory(day) {
    const story = vocabStories[day];
    if (story) {
        storyTitle.textContent = `A Tale from ${day}`;
        storyContent.innerHTML = story;
        storyModal.classList.remove('modal-hidden');
    }
}
function hideStory() { storyModal.classList.add('modal-hidden'); }
storyCloseBtn.addEventListener('click', hideStory);
storyOverlay.addEventListener('click', hideStory);

document.body.addEventListener('click', function (event) {
    if (event.target.classList.contains('read-story-btn')) {
        const day = event.target.getAttribute('data-day'); showStory(day);
    }
});