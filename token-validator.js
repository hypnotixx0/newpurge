// token-validator.js - For protected pages (games.html, apps.html, etc.)
(function() {
    'use strict';
    
    console.log('🔐 Token validator v4.0');
    
    // Configuration
    const AUTH_KEY = "purge_auth";
    const AUTH_LEVEL = "purge_auth_level";
    const AUTH_TIMESTAMP = "purge_auth_timestamp";
    const AUTH_KEY_USED = "purge_auth_key";
    const AUTH_HASH = "purge_auth_hash";
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    
    // Valid keys
    const VALID_KEYS = {
        free: ['IMPOOR'],
        premium: ['CHARLESISPOOR', 'UNHIIN', 'SOSAPARTY']
    };
    
    // Salt for hash
    const SALT = 'p' + 'u' + 'r' + 'g' + 'e' + '_' + 's' + 'e' + 'c' + 'r' + 'e' + 't' + '_' + '2' + '0' + '2' + '5';
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    console.log('📄 Checking page:', currentPage);
    
    // Pages that don't need auth
    const PUBLIC_PAGES = ['index.html', 'blocked.html', ''];
    if (PUBLIC_PAGES.includes(currentPage)) {
        console.log('✅ Public page, no auth needed');
        return;
    }
    
    console.log('🔒 Protected page - checking auth...');
    
    // Wait a moment for everything to load
    setTimeout(checkAuth, 100);
    
    function checkAuth() {
        try {
            console.log('🔍 Validating session...');
            
            // Get session data
            const auth = sessionStorage.getItem(AUTH_KEY);
            const level = sessionStorage.getItem(AUTH_LEVEL);
            const timestamp = sessionStorage.getItem(AUTH_TIMESTAMP);
            const key = sessionStorage.getItem(AUTH_KEY_USED);
            const hash = sessionStorage.getItem(AUTH_HASH);
            
            console.log('📊 Session data loaded');
            
            // Check 1: All data exists
            if (!auth || auth !== "authenticated") {
                console.log('❌ Not authenticated');
                redirectToBlocked();
                return;
            }
            
            if (!level || !timestamp || !key || !hash) {
                console.log('❌ Incomplete session data');
                redirectToBlocked();
                return;
            }
            
            // Check 2: Session not expired
            const sessionTime = parseInt(timestamp);
            const now = Date.now();
            const elapsed = now - sessionTime;
            
            if (isNaN(sessionTime) || elapsed > SESSION_DURATION || elapsed < 0) {
                console.log('❌ Session expired');
                redirectToBlocked();
                return;
            }
            
            // Check 3: Valid key
            const keyUpper = key.toUpperCase();
            const isValidFree = VALID_KEYS.free.includes(keyUpper);
            const isValidPremium = VALID_KEYS.premium.includes(keyUpper);
            
            if (level === 'free' && !isValidFree) {
                console.log('❌ Invalid free key');
                redirectToBlocked();
                return;
            }
            
            if (level === 'premium' && !isValidPremium) {
                console.log('❌ Invalid premium key');
                redirectToBlocked();
                return;
            }
            
            // Check 4: Page permissions
            const premiumPages = [
                'games.html', 'apps.html', 'tools.html', 'roadmap.html',
                'themes.html', 'chat.html', 'credits.html', 'settings.html',
                'admin.html'
            ];
            
            const freePages = ['games.html'];
            
            if (level === 'free' && !freePages.includes(currentPage)) {
                console.log('❌ Free user cannot access:', currentPage);
                redirectToBlocked();
                return;
            }
            
            if (level === 'premium' && !premiumPages.includes(currentPage)) {
                console.log('❌ Premium user cannot access:', currentPage);
                redirectToBlocked();
                return;
            }
            
            // SUCCESS!
            console.log('✅ Authentication SUCCESSFUL!');
            console.log('👤 Level:', level);
            console.log('🔑 Key:', keyUpper);
            console.log('⏰ Session age:', Math.round(elapsed / 1000), 'seconds');
            
        } catch (error) {
            console.error('❌ Auth check error:', error);
            redirectToBlocked();
        }
    }
    
    function redirectToBlocked() {
        console.log('🚫 Redirecting to blocked.html');
        
        // Clear invalid session
        sessionStorage.clear();
        
        // Redirect
        setTimeout(() => {
            window.location.replace('blocked.html');
        }, 100);
    }
    
})();