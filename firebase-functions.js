// Async Firestore Load Function - REPLACE loadTimelineEvents() with this
const loadTimelineEvents = async () => {
	if (!firebaseInitialized || !db) {
		// Fallback to localStorage
		try {
			const raw = JSON.parse(localStorage.getItem(timelineStorageKey)) || [];
			return raw.filter((evt) => evt && evt.date && evt.title);
		} catch (error) {
			console.warn('Unable to load timeline events from localStorage', error);
			setTimelineMessage('Timeline data could not be loaded.');
			return [];
		}
	}

	try {
		const snapshot = await db.collection('timeline-events').orderBy('date').get();
		const events = [];
		snapshot.forEach((doc) => {
			events.push({ id: doc.id, ...doc.data() });
		});
		console.log(`Loaded ${events.length} events from Firestore`);
		return events;
	} catch (error) {
		console.warn('Unable to load from Firestore, falling back to localStorage:', error);
		try {
			const raw = JSON.parse(localStorage.getItem(timelineStorageKey)) || [];
			return raw.filter((evt) => evt && evt.date && evt.title);
		} catch (localError) {
			console.warn('LocalStorage also failed:', localError);
			return [];
		}
	}
};

// Async Firestore Save Function - REPLACE saveTimelineEvents() with this
const saveTimelineEvents = async () => {
	if (!firebaseInitialized || !db) {
		// Fallback to localStorage
		try {
			localStorage.setItem(timelineStorageKey, JSON.stringify(timelineEvents));
		} catch (error) {
			console.warn('Unable to save timeline events to localStorage', error);
			setTimelineMessage('Memories could not be saved.');
		}
		return;
	}

	try {
		// Save each event to Firestore
		const batch = db.batch();
		timelineEvents.forEach((evt) => {
			const docRef = db.collection('timeline-events').doc(evt.id);
			batch.set(docRef, {
				date: evt.date,
				title: evt.title,
				description: evt.description || '',
				photo: evt.photo || null
			});
		});
		await batch.commit();
		console.log('Events saved to Firestore');
		// Also save to localStorage as backup
		try {
			localStorage.setItem(timelineStorageKey, JSON.stringify(timelineEvents));
		} catch (e) {
			console.warn('LocalStorage backup failed:', e);
		}
	} catch (error) {
		console.warn('Unable to save to Firestore, saving to localStorage:', error);
		try {
			localStorage.setItem(timelineStorageKey, JSON.stringify(timelineEvents));
		} catch (localError) {
			console.warn('LocalStorage also failed:', localError);
			setTimelineMessage('Memories could not be saved.');
		}
	}
};

// Add this NEW function after saveTimelineEvents
const deleteEventFromFirestore = async (eventId) => {
	if (!firebaseInitialized || !db) return;
	try {
		await db.collection('timeline-events').doc(eventId).delete();
		console.log('Event deleted from Firestore');
	} catch (error) {
		console.warn('Unable to delete from Firestore:', error);
	}
};

// Update initTimeline to be async - REPLACE initTimeline() with this
const initTimeline = async () => {
	if (!timelineEls.form) return;
	timelineEvents = await loadTimelineEvents();  // Add await here
	currentTimelineYear = Math.max(startYear, Math.min(todayYear, currentTimelineYear));
	timelineEls.eventDate.max = formatInputDate(today);
	renderTimeline();
	timelineEls.form.addEventListener('submit', handleEventSubmit);
};

// In renderEventList function, find the delete button click handler and ADD await:
deleteBtn.addEventListener('click', async () => {  // Make this async
	await deleteEventFromFirestore(evt.id);  // Add this line BEFORE filter
	timelineEvents = timelineEvents.filter((item) => item.id !== evt.id);
	await saveTimelineEvents();  // Add await
	setTimelineMessage('Memory deleted.');
	renderTimeline();
});

// In showEventModal function, find the delete button and ADD await:
deleteModalBtn.addEventListener('click', async () => {  // Make this async
	await deleteEventFromFirestore(evt.id);  // Add this line BEFORE filter
	timelineEvents = timelineEvents.filter((item) => item.id !== evt.id);
	await saveTimelineEvents();  // Add await
	hideEventModal();
	setTimelineMessage('Memory deleted.');
	renderTimeline();
});

// handleEventSubmit should already be async, just ADD await to saveTimelineEvents call:
// Find this line:
// saveTimelineEvents();
// Replace with:
// await saveTimelineEvents();
