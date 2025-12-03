// unified-auth.js - Single Auth System for /Purge
// One-time key entry per tab session using sessionStorage
(function() {
    'use strict';
    
    console.log('🔐 /Purge Unified Auth System v1.0');
    
    // ===== CONFIGURATION =====
    const KEYS = {
        FREE: ['IMPOOR'],
        PREMIUM: ['CHARLESISPOOR', 'UNHIIN', 'SOSAPARTY']
    };
    
    const SESSION = {
        AUTH: 'purge_auth',
        LEVEL: 'purge_auth_level',
        KEY: 'purge_auth_key',
        TIMESTAMP: 'purge_auth_timestamp',
        HASH: 'purge_auth_hash'
    };
    
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    
    // ===== UTILITY FUNCTIONS =====
    function isIndexPage() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        return page === 'index.html' || page === '' || page === 'blocked.html';
    }
    
    function getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }
    
    function checkSession() {
        try {
            const auth = sessionStorage.getItem(SESSION.AUTH);
            const level = sessionStorage.getItem(SESSION.LEVEL);
            const key = sessionStorage.getItem(SESSION.KEY);
            const timestamp = sessionStorage.getItem(SESSION.TIMESTAMP);
            const hash = sessionStorage.getItem(SESSION.HASH);

            if (!auth || auth !== 'authenticated' || !level || !key || !timestamp || !hash) {
                return null;
            }

            // Check expiration
            const sessionTime = parseInt(timestamp);
            const now = Date.now();
            if (isNaN(sessionTime) || (now - sessionTime) > SESSION_DURATION) {
                console.log('❌ Session expired');
                sessionStorage.clear();
                return null;
            }

            console.log(`✅ Valid session: ${level} (${key})`);
            return { level, key };
        } catch (e) {
            console.error('Session check error:', e);
            return null;
        }
    }
    
    function saveSession(key, level) {
        const timestamp = Date.now().toString();

        // Generate hash for integrity check (same as key-system.js)
        const SALT = 'p' + 'u' + 'r' + 'g' + 'e' + '_' + 's' + 'e' + 'c' + 'r' + 'e' + 't' + '_' + '2' + '0' + '2' + '5';
        const data = `${key}_${level}_${timestamp}_${SALT}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const authHash = Math.abs(hash).toString(36);

        sessionStorage.setItem(SESSION.AUTH, 'authenticated');
        sessionStorage.setItem(SESSION.LEVEL, level);
        sessionStorage.setItem(SESSION.KEY, key);
        sessionStorage.setItem(SESSION.TIMESTAMP, timestamp);
        sessionStorage.setItem(SESSION.HASH, authHash);
        console.log(`💾 Session saved: ${level} (${key})`);
    }
    
    function validateKey(key) {
        const keyUpper = key.trim().toUpperCase();
        
        if (KEYS.PREMIUM.includes(keyUpper)) {
            return { valid: true, level: 'premium' };
        }
        
        if (KEYS.FREE.includes(keyUpper)) {
            return { valid: true, level: 'free' };
        }
        
        return { valid: false, level: null };
    }
    
    function canAccessPage(level, page) {
        const premiumPages = [
            'games.html', 'apps.html', 'tools.html', 'roadmap.html',
            'themes.html', 'credits.html', 'settings.html'
        ];
        
        const freePages = ['games.html'];
        
        if (level === 'free') {
            return freePages.includes(page);
        }
        
        if (level === 'premium') {
            return premiumPages.includes(page);
        }
        
        return false;
    }
    
    // ===== PAGE PROTECTION (for non-index pages) =====
    function protectPage() {
        const currentPage = getCurrentPage();
        
        if (currentPage === 'blocked.html') {
            console.log('🚫 Blocked page - no auth check');
            return;
        }
        
        console.log(`🔍 Checking access for: ${currentPage}`);
        
        const session = checkSession();
        
        if (!session) {
            console.log('❌ No valid session - redirecting to index');
            sessionStorage.clear();
            window.location.replace('index.html');
            return;
        }
        
        if (!canAccessPage(session.level, currentPage)) {
            console.log(`❌ ${session.level} cannot access ${currentPage}`);
            sessionStorage.clear();
            window.location.replace('blocked.html');
            return;
        }
        
        console.log(`✅ Access granted to ${currentPage}`);
    }
    
    // ===== INDEX PAGE AUTH OVERLAY =====
    function initAuthOverlay() {
        console.log('🎬 Initializing auth overlay');
        
        const overlay = document.getElementById('purge-auth-overlay');
        if (!overlay) {
            console.error('❌ Auth overlay not found');
            return;
        }
        
        // Check if already authenticated
        const session = checkSession();
        if (session) {
            console.log('✅ Already authenticated, hiding overlay');
            overlay.style.display = 'none';
            unlockCategories(session.level);
            return;
        }
        
        // Show overlay
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('active'), 100);
        
        setupAuthUI();
    }
    
    function setupAuthUI() {
        const container = document.querySelector('.auth-container');
        const keyInput = document.getElementById('auth-key-input');
        const showKeyBtn = document.getElementById('auth-show-key');
        const submitBtn = document.getElementById('auth-submit');
        const authStatus = document.getElementById('auth-status');

        // Auto-scroll to key section with smooth animation
        setTimeout(() => {
            if (container && !container.classList.contains('scrolled')) {
                container.classList.add('scrolled');
                console.log('🔄 Auto-scrolled to key section');
            }
        }, 3000); // Scroll after 3 seconds to see the welcome message longer
        
        // Show/hide password
        if (showKeyBtn && keyInput) {
            showKeyBtn.addEventListener('click', function() {
                keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
                this.innerHTML = keyInput.type === 'password' 
                    ? '<i class="fas fa-eye"></i>' 
                    : '<i class="fas fa-eye-slash"></i>';
            });
        }
        
        // Validate and submit
        function handleSubmit() {
            const key = keyInput.value.trim();
            
            if (!key) {
                showStatus('Please enter a key', 'error');
                return;
            }
            
            submitBtn.classList.add('loading');
            authStatus.className = 'auth-status';
            
            setTimeout(() => {
                const result = validateKey(key);
                
                if (result.valid) {
                    saveSession(key, result.level);
                    showStatus(`✅ ${result.level === 'premium' ? 'Premium' : 'Free'} access granted!`, 'success');
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('auth-success');
                    
                    // Hide overlay and unlock
                    setTimeout(() => {
                        const overlay = document.getElementById('purge-auth-overlay');
                        overlay.classList.add('fade-out');
                        
                        setTimeout(() => {
                            overlay.style.display = 'none';
                            unlockCategories(result.level);
                            showAnnouncement();
                        }, 800);
                    }, 1200);
                } else {
                    showStatus('Invalid key. Try: IMPOOR (free)', 'error');
                    submitBtn.classList.remove('loading');
                    keyInput.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => keyInput.style.animation = '', 500);
                }
            }, 300);
        }
        
        function showStatus(message, type) {
            if (authStatus) {
                authStatus.className = `auth-status ${type} show`;
                authStatus.textContent = message;
            }
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', handleSubmit);
        }
        
        if (keyInput) {
            keyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSubmit();
            });
        }
    }
    
    function unlockCategories(level) {
        console.log(`🔓 Unlocking categories for ${level}`);

        const boxes = document.querySelectorAll('.category-box');
        boxes.forEach((box, index) => {
            setTimeout(() => {
                box.classList.add('unlocked');

                // Restrict free users - show popup instead of disabling
                if (level === 'free' && !box.getAttribute('href').includes('games')) {
                    box.style.opacity = '0.5';
                    box.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log('🎯 Click detected on premium category');
                        const category = box.getAttribute('href').replace('.html', '').replace('/', '');
                        console.log(`🎯 Attempting to show popup for: ${category}`);
                        if (window.showKeyPopup) {
                            console.log('✅ showKeyPopup function found, calling it');
                            window.showKeyPopup(category);
                        } else {
                            console.error('❌ showKeyPopup function not found!');
                        }
                    });
                    box.title = 'Enter premium key to access';
                }
            }, index * 100);
        });
    }
    
    function showAnnouncement() {
        setTimeout(() => {
            if (announcementManager && typeof announcementManager.showAnnouncement === 'function') {
                announcementManager.showAnnouncement();
                console.log('📢 Announcement shown via manager');
                // Mark as shown for this session
                sessionStorage.setItem('purge_announcement_shown', 'true');
            } else {
                // Fallback if manager not available
                const modal = document.getElementById('announcement-modal');
                if (modal) {
                    modal.classList.add('active');
                    console.log('📢 Announcement shown (fallback)');
                }
            }
        }, 800);
    }
    
    // ===== INITIALIZATION =====
    function init() {
        if (isIndexPage()) {
            // Index page: show auth overlay if not authenticated
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initAuthOverlay);
            } else {
                initAuthOverlay();
            }
        } else {
            // Protected page: check auth
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', protectPage);
            } else {
                protectPage();
            }
        }
    }
    
    // ===== GLOBAL DEBUG FUNCTIONS =====
    window.checkAuth = function() {
        const session = checkSession();
        if (session) {
            console.log(`👤 ${session.level.toUpperCase()} user (${session.key})`);
        } else {
            console.log('❌ No active session');
        }
    };
    
    window.clearAuth = function() {
        sessionStorage.clear();
        console.log('🗑️ Session cleared - reload page');
        window.location.reload();
    };
    
    window.testKey = function(key) {
        const input = document.getElementById('auth-key-input');
        if (input) {
            input.value = key;
            console.log(`🔑 Testing: ${key}`);
        }
    };
    
    // Start
    init();
    
})();
