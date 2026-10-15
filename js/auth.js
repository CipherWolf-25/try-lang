/* ==========================================================================
   MENSIFY — auth.js  (login.html + signup.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Password show/hide (shared)
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁';
    });
  });

  /* ---------------- SIGNUP ---------------- */
  const signupForm = document.getElementById('signupForm');
  if (signupForm){
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const msg = document.getElementById('signupMsg');
      msg.className = 'form-msg'; msg.textContent = '';

      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const agree = document.getElementById('agreeTerms').checked;

      let valid = true;
      valid = setField('fFirstName', firstName.length > 0) && valid;
      valid = setField('fLastName', lastName.length > 0) && valid;
      valid = setField('fUsername', /^[a-zA-Z0-9_]{4,}$/.test(username)) && valid;
      valid = setField('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && valid;
      valid = setField('fPhone', /^[0-9+\-\s]{7,15}$/.test(phone)) && valid;
      valid = setField('fPassword', /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) && valid;
      valid = setField('fConfirmPassword', password === confirmPassword && confirmPassword.length > 0) && valid;

      if (!valid){ showMsg(msg, 'Please fix the highlighted fields.', 'error'); return; }
      if (!agree){ showMsg(msg, 'You must agree to the Terms & Conditions to continue.', 'error'); return; }

      if (DB.findUserByEmailOrUsername(email) || DB.findUserByEmailOrUsername(username)){
        showMsg(msg, 'An account with this email or username already exists.', 'error');
        return;
      }

      const user = DB.createUser({ firstName, lastName, username, email, phone, password });
      DB.setSession(user.id, true);
      showMsg(msg, 'Account created! Redirecting…', 'success');
      updateNavCounts();
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    });
  }

  /* ---------------- LOGIN ---------------- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm){
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const msg = document.getElementById('loginMsg');
      const idVal = document.getElementById('loginId').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const remember = document.getElementById('rememberMe').checked;

      let valid = true;
      valid = setField('fLoginId', idVal.length > 0) && valid;
      valid = setField('fLoginPass', pass.length > 0) && valid;
      if (!valid){ showMsg(msg, 'Please fill in all fields.', 'error'); return; }

      const user = DB.findUserByEmailOrUsername(idVal);
      if (!user || user.password !== pass){
        showMsg(msg, 'Incorrect email/username or password.', 'error');
        return;
      }
      DB.setSession(user.id, remember);
      showMsg(msg, `Welcome back, ${user.firstName}! Redirecting…`, 'success');
      updateNavCounts();
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      setTimeout(() => { window.location.href = next || 'index.html'; }, 800);
    });

    // Forgot password modal
    const forgotModal = document.getElementById('forgotModal');
    document.getElementById('forgotPassLink').addEventListener('click', e => { e.preventDefault(); forgotModal.classList.add('open'); });
    document.getElementById('forgotModalClose').addEventListener('click', () => forgotModal.classList.remove('open'));
    document.getElementById('forgotSubmitBtn').addEventListener('click', () => {
      const email = document.getElementById('forgotEmail').value.trim();
      const user = DB.findUserByEmailOrUsername(email);
      if (!user){ toast('No account found with that email.', 'error'); return; }
      const tempPass = 'Mensify' + Math.floor(1000 + Math.random()*9000);
      DB.updateUser(user.id, { password: tempPass });
      alert(`Since this is a front-end only demo, no email service is connected.\n\nYour temporary password is: ${tempPass}\n\nUse it to log in, then update your password from your profile.`);
      forgotModal.classList.remove('open');
    });
  }

  function setField(fieldId, isValid){
    const el = document.getElementById(fieldId);
    if (!el) return true;
    el.classList.toggle('invalid', !isValid);
    el.classList.toggle('valid', isValid);
    return isValid;
  }
  function showMsg(el, text, type){
    el.textContent = text;
    el.className = 'form-msg show ' + type;
  }
});
