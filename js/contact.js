// Contact Form Handler

document.addEventListener('DOMContentLoaded', () => {
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
      // In a real application, you would send this to a server/email service
      // For now, we'll simulate sending and show a success message
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the data (in production, send to backend)
      console.log('Contact form submitted:', data);

      // Show success message
      showStatus('Message sent successfully! We\'ll get back to you soon. ✓', 'success');

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
