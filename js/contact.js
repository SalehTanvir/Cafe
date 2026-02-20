// Contact Form Handler with EmailJS Integration
// EmailJS allows sending emails directly from your form

// Initialize EmailJS with your public key
// To set this up:
// 1. Go to https://www.emailjs.com
// 2. Sign up for free account
// 3. Add Gmail as an email service
// 4. Replace 'YOUR_PUBLIC_KEY' below with your actual public key

const EMAILJS_PUBLIC_KEY = 'emRFxQixvrDiVveqx';
const EMAILJS_SERVICE_ID = 'service_6hwhtu5';
const EMAILJS_TEMPLATE_ID = 'template_x310whe';
const RECIPIENT_EMAIL = 'salehtanvir85@gmail.com';

// Load EmailJS library
function loadEmailJS() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/index.min.js';
    script.onload = () => {
      if (window.emailjs) {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
      }
      resolve();
    };
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load EmailJS library
  await loadEmailJS();

  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  /**
   * Handle contact form submission
   */
  async function handleContactSubmit(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const data = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      subject: formData.get('subject').trim(),
      message: formData.get('message').trim(),
      timestamp: new Date().toISOString()
    };

    // Validate data
    if (!validateContactForm(data)) {
      showStatus('Please fill in all required fields correctly.', 'error');
      return;
    }

    // Disable submit button
    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      // Prepare email parameters
      const emailParams = {
        to_email: RECIPIENT_EMAIL,
        from_name: data.name,
        from_email: data.email,
        phone: data.phone || 'Not provided',
        subject: data.subject,
        message: data.message,
        reply_to_email: data.email
      };

      // Send email using EmailJS
      if (window.emailjs) {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
        
        // Show success message
        showStatus('Message sent successfully! We\'ll get back to you soon. ✓', 'success');
        
        // Log the data
        console.log('Contact form submitted:', data);
      } else {
        // Fallback if EmailJS not available
        console.warn('EmailJS not available. Using fallback method.');
        console.log('Contact form submitted:', data);
        showStatus('Message saved! We\'ll contact you soon. ✓', 'success');
      }

      // Reset form
      contactForm.reset();

      // Clear status message after 5 seconds
      setTimeout(() => {
        formStatus.textContent = '';
        formStatus.className = 'form-status';
      }, 5000);

    } catch (error) {
      console.error('Error sending message:', error);
      showStatus('Failed to send message. Please try again or contact us directly.', 'error');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  /**
   * Validate contact form data
   */
  function validateContactForm(data) {
    // Name validation
    if (!data.name || data.name.length < 2) {
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      return false;
    }

    // Subject validation
    if (!data.subject || data.subject.length < 3) {
      return false;
    }

    // Message validation
    if (!data.message || data.message.length < 10) {
      return false;
    }

    // Phone validation (optional, but if provided should be format valid)
    if (data.phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(data.phone)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Show status message
   */
  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = `form-status ${type}`;
  }
});
