/* ==========================================================================
   MENSIFY — contact.js  (contact.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('contactMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      name: document.getElementById('cName').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
      subject: document.getElementById('cSubject').value.trim(),
      message: document.getElementById('cMessage').value.trim()
    };
    if (!data.name || !data.email || !data.message){
      msg.className = 'form-msg show error';
      msg.textContent = 'Please complete all required fields.';
      return;
    }
    DB.addContactMessage(data);
    msg.className = 'form-msg show success';
    msg.textContent = 'Message sent! We will get back to you within one business day.';
    form.reset();
  });
});
