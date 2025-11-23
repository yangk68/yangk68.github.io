# Firebase Integration - Manual Steps

Firebase SDKs and initialization are already added to index.html.  
The remaining changes need to be made carefully to avoid file corruption.

## Required Changes in index.html

### 1. Replace loadTimelineEvents function (around line 1025)

**Find:**
```javascript
const loadTimelineEvents = () => {
	try {
		const raw = JSON.parse(localStorage.getItem(timelineStorageKey)) || [];
		return raw.filter((evt) => evt && evt.date && evt.title);
	} catch (error) {
		console.warn('Unable to load timeline events', error);
		setTimelineMessage('Timeline data could not be loaded. Local storage may be disabled.');
		return [];
	}
};
```

**Replace with:** See `firebase-functions.js` for the async version with Firestore integration.

### 2. Replace saveTimelineEvents function (around line 1036)

**Find:**
```javascript
const saveTimelineEvents = () => {
	try {
		localStorage.setItem(timelineStorageKey, JSON.stringify(timelineEvents));
	} catch (error) {
		console.warn('Unable to save timeline events', error);
		setTimelineMessage('Memories could not be saved. Check browser storage settings.');
	}
};
```

**Replace with:** See `firebase-functions.js` for the async version with Firestore integration.

### 3. Add deleteEventFromFirestore function (after saveTimelineEvents)

**Add this NEW function:**
```javascript
const deleteEventFromFirestore = async (eventId) => {
	if (!firebaseInitialized || !db) return;
	try {
		await db.collection('timeline-events').doc(eventId).delete();
		console.log('Event deleted from Firestore');
	} catch (error) {
		console.warn('Unable to delete from Firestore:', error);
	}
};
```

### 4. Update initTimeline function (around line 1348)

**Find:**
```javascript
const initTimeline = () => {
	if (!timelineEls.form) return;
	timelineEvents = loadTimelineEvents();
```

**Change to:**
```javascript
const initTimeline = async () => {
	if (!timelineEls.form) return;
	timelineEvents = await loadTimelineEvents();
```

### 5. Update renderEventList delete handler (around line 1158)

**Find:**
```javascript
deleteBtn.addEventListener('click', () => {
	timelineEvents = timelineEvents.filter((item) => item.id !== evt.id);
	saveTimelineEvents();
	setTimelineMessage('Memory deleted.');
	renderTimeline();
});
```

**Change to:**
```javascript
deleteBtn.addEventListener('click', async () => {
	await deleteEventFromFirestore(evt.id);
	timelineEvents = timelineEvents.filter((item) => item.id !== evt.id);
	await saveTimelineEvents();
	setTimelineMessage('Memory deleted.');
	renderTimeline();
});
```

### 6. Update showEventModal delete handler (around line 1302)

**Find:**
```javascript
deleteModalBtn.addEventListener('click', () => {
	timelineEvents = timelineEvents.filter((item) => item.id !== evt.id);
	saveTimelineEvents();
	hideEventModal();
	setTimelineMessage('Memory deleted.');
	renderTimeline();
});
```

**Change to:**
```javascript
deleteModalBtn.addEventListener('click', async () => {
	await deleteEventFromFirestore(evt.id);
	timelineEvents = timelineEvents.filter((item) => item.id !== evt.id);
	await saveTimelineEvents();
	hideEventModal();
	setTimelineMessage('Memory deleted.');
	renderTimeline();
});
```

### 7. Update handleEventSubmit save call (around line 1258)

**Find:**
```javascript
timelineEvents.push(newEvent);
saveTimelineEvents();
setTimelineMessage('Memory saved!');
```

**Change to:**
```javascript
timelineEvents.push(newEvent);
await saveTimelineEvents();
setTimelineMessage('Memory saved!');
```

## Alternative: Use the Complete Script

If manual editing is prone to errors, I can generate a complete corrected index.html file.
Let me know if you prefer that approach!

## Testing After Changes

1. Open browser console (F12)
2. Load the site
3. You should see: `"Firebase initialized successfully"`
4. Add a timeline event
5. You should see: `"Events saved to Firestore"`
6. Refresh the page
7. You should see: `"Loaded X events from Firestore"`
8. Open Firebase Console → Firestore Database → timeline-events collection
9. You should see your events stored there

## Troubleshooting

- If you see localStorage warnings, Firebase isn't connecting
- Check Firebase Console → Firestore Database is enabled
- Check Firestore Rules allow read/write
- Check browser console for specific errors
