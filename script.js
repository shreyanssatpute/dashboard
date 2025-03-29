// DOM Elements
const eventsContainer = document.getElementById('events-container');
const noEventsElement = document.getElementById('no-events');
const totalEventsElement = document.getElementById('total-events');
const todayEventsElement = document.getElementById('today-events');
const searchInput = document.getElementById('search-input');
const cameraFilter = document.getElementById('camera-filter');
const timeFilter = document.getElementById('time-filter');
const eventModal = document.getElementById('event-modal');
const closeModal = document.getElementById('close-modal');
const modalImage = document.getElementById('modal-image');
const modalCamera = document.getElementById('modal-camera');
const modalTimestamp = document.getElementById('modal-timestamp');
const modalId = document.getElementById('modal-id');

// Constants
const LOCAL_STORAGE_KEY = 'dashboard_events';

// Variables
let allEvents = [];
let filteredEvents = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for event ID in URL parameters
    checkUrlForEventId();
    
    // Load existing events
    loadEvents();
    
    // Setup event listeners
    setupEventListeners();
});

// Check URL for event ID parameter
function checkUrlForEventId() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    
    if (eventId) {
        // Try to get the event data from localStorage
        const eventData = localStorage.getItem(`dashboard_event_${eventId}`);
        
        if (eventData) {
            try {
                const event = JSON.parse(eventData);
                
                // Add formatted time for display
                const timestamp = new Date(event.timestamp);
                event.formattedTime = timestamp.toLocaleString();
                
                // Add to events array
                addEvent(event);
                
                // Clear the URL parameter to avoid duplicate imports on refresh
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Show notification
                showNotification('New event received');
            } catch (error) {
                console.error('Error parsing event data:', error);
            }
        }
    }
}

// Add an event to the dashboard
function addEvent(event) {
    // Check if event already exists
    const existingEventIndex = allEvents.findIndex(e => e.id === event.id);
    
    if (existingEventIndex === -1) {
        // Add new event
        allEvents.push(event);
    } else {
        // Update existing event
        allEvents[existingEventIndex] = event;
    }
    
    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allEvents));
    
    // Update UI
    updateStats();
    applyFilters();
}

// Load events from localStorage
function loadEvents() {
    const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (storedEvents) {
        try {
            allEvents = JSON.parse(storedEvents);
            updateStats();
            applyFilters();
        } catch (error) {
            console.error('Error loading events:', error);
            allEvents = [];
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', applyFilters);
    
    // Filters
    cameraFilter.addEventListener('change', applyFilters);
    timeFilter.addEventListener('change', applyFilters);
    
    // Modal close button
    closeModal.addEventListener('click', () => {
        eventModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === eventModal) {
            eventModal.style.display = 'none';
        }
    });
}

// Apply filters and search
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCamera = cameraFilter.value;
    const selectedTimeFrame = timeFilter.value;
    
    filteredEvents = allEvents.filter(event => {
        // Camera filter
        if (selectedCamera !== 'all' && event.cameraName !== selectedCamera) {
            return false;
        }
        
        // Time filter
        if (selectedTimeFrame !== 'all') {
            const eventDate = new Date(event.timestamp);
            const today = new Date();
            
            if (selectedTimeFrame === 'today') {
                if (eventDate.toDateString() !== today.toDateString()) {
                    return false;
                }
            } else if (selectedTimeFrame === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 7);
                if (eventDate < weekAgo) {
                    return false;
                }
            } else if (selectedTimeFrame === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(today.getMonth() - 1);
                if (eventDate < monthAgo) {
                    return false;
                }
            }
        }
        
        // Search term
        if (searchTerm) {
            const eventText = `${event.cameraName} ${event.formattedTime || ''}`.toLowerCase();
            if (!eventText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    renderEvents();
}

// Render events to the UI
function renderEvents() {
    // Clear previous events, but keep the no-events element
    Array.from(eventsContainer.children).forEach(child => {
        if (child !== noEventsElement) {
            child.remove();
        }
    });
    
    // Show/hide no events message
    if (filteredEvents.length === 0) {
        noEventsElement.style.display = 'flex';
    } else {
        noEventsElement.style.display = 'none';
        
        // Sort events by timestamp (newest first)
        filteredEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Add events to container
        filteredEvents.forEach(event => {
            const eventCard = createEventCard(event);
            eventsContainer.appendChild(eventCard);
        });
    }
}

// Create an event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
        <img src="${event.imageData}" alt="Event at ${event.formattedTime || ''}" class="event-image">
        <div class="event-details">
            <div class="event-camera">${event.cameraName}</div>
            <div class="event-timestamp">${event.formattedTime || new Date(event.timestamp).toLocaleString()}</div>
        </div>
    `;
    
    // Add click event to open modal
    card.addEventListener('click', () => {
        openEventModal(event);
    });
    
    return card;
}

// Open event modal with details
function openEventModal(event) {
    modalImage.src = event.imageData;
    modalCamera.textContent = event.cameraName;
    modalTimestamp.textContent = event.formattedTime || new Date(event.timestamp).toLocaleString();
    modalId.textContent = event.id;
    
    eventModal.style.display = 'flex';
}

// Update dashboard statistics
function updateStats() {
    // Total events
    totalEventsElement.textContent = allEvents.length;
    
    // Today's events
    const today = new Date().toDateString();
    const todayEvents = allEvents.filter(event => {
        const eventDate = new Date(event.timestamp).toDateString();
        return eventDate === today;
    });
    
    todayEventsElement.textContent = todayEvents.length;
}

// Show notification
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
        
        // Add styles if not already in CSS
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 25px;
                border-radius: 30px;
                font-size: 0.9rem;
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .notification.show {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
