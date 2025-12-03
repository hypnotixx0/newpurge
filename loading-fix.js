// loading-fix.js
(function() {
    'use strict';
    
    console.log('⚡ Loading fix initialized');
    
    function hideLoadingScreen() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            console.log('✅ Hiding loading screen');
            loading.classList.add('fade-out');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 600);
        }
    }
    
    setTimeout(hideLoadingScreen, 1000);
    window.addEventListener('load', hideLoadingScreen);
    document.addEventListener('DOMContentLoaded', hideLoadingScreen);
    
})();