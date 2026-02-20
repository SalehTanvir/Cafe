// Highlight the current page in navbar
export function setActiveNav() {
  const navLinks = document.querySelectorAll('nav a');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Remove active class from all links
    link.classList.remove('active');
    
    // Add active class to current page
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Call when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setActiveNav);
} else {
  setActiveNav();
}
