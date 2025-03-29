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
const SESSION_STORAGE_KEY = 'dashboard_events';

// Variables
let allEvents = [];
let filteredEvents = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupEventListeners();
    checkForNewEvents();
});

// Load events from storage
function loadEvents() {
    // Try to load from localStorage first (persistent storage)
    const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedEvents) {
        allEvents = JSON.parse(storedEvents);
    }
    
    // Check sessionStorage for new events from the camera page
    const sessionEvents = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionEvents) {
        const newEvents = JSON.parse(sessionEvents);
        
        // Merge events and remove duplicates
        const mergedEvents = [...allEvents, ...newEvents];
        allEvents = mergedEvents.filter((event, index, self) => 
            index === self.findIndex((e) => e.id === event.id)
        );
        
        // Save merged events back to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allEvents));
        
        // Clear sessionStorage after processing
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    
    updateStats();
    applyFilters();
}

// Check for new events periodically
function checkForNewEvents() {
    setInterval(() => {
        const sessionEvents = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionEvents) {
            loadEvents();
        }
    }, 2000);
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
            const eventText = `${event.cameraName} ${event.formattedTime}`.toLowerCase();
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
        <img src="${event.imageData}" alt="Event at ${event.formattedTime}" class="event-image">
        <div class="event-details">
            <div class="event-camera">${event.cameraName}</div>
            <div class="event-timestamp">${event.formattedTime}</div>
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
    modalTimestamp.textContent = event.formattedTime;
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