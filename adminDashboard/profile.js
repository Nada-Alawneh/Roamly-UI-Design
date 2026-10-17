const adminProfileKey = 'roamly-admin-profile';
let profilePhotoData = '';
let profileToastTimer;

function loadProfileData() {
  try {
    const data = JSON.parse(localStorage.getItem(adminProfileKey) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch (error) {
    return {};
  }
}

function showProfileToast(message, isError = false) {
  const toast = document.getElementById('profileToast');
  const toastMessage = document.getElementById('profileToastMessage');
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.toggle('profile-toast--error', isError);
  toast.classList.add('is-visible');
  window.clearTimeout(profileToastTimer);
  profileToastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function initialsFor(name) {
  return (name.trim() || 'Admin').split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
}

function paintProfile(profile) {
  const name = profile.name || 'Nada Alawneh';
  const role = profile.role || 'Lead System Architect';
  document.getElementById('profileAvatar').textContent = initialsFor(name);
  document.getElementById('profileAvatar').classList.toggle('has-photo', Boolean(profilePhotoData));
  document.getElementById('profileAvatar').style.backgroundImage = profilePhotoData ? `url("${profilePhotoData}")` : '';
  document.getElementById('portraitName').textContent = name;
  document.getElementById('portraitRole').textContent = role;

  const fields = {
    profileName: name,
    profileRole: role,
    profileEmail: profile.email || 'nada@roamly.com',
    profilePhone: profile.phone || '',
    profileBio: profile.bio || ''
  };
  Object.entries(fields).forEach(([id, value]) => { document.getElementById(id).value = value; });

  document.getElementById('profileLanguage').value = profile.language || 'English';
  document.getElementById('profileTimezone').value = profile.timezone || 'Asia/Amman';
  document.getElementById('prefProductUpdates').checked = profile.productUpdates !== false;
  document.getElementById('prefWeeklySummary').checked = profile.weeklySummary !== false;
  updateCompletion(fields);
}

function updateCompletion(fields) {
  const completed = [fields.profileName, fields.profileRole, fields.profileEmail].filter(Boolean).length;
  const percent = Math.round((completed / 3) * 100);
  document.getElementById('profileCompletion').textContent = `${percent}%`;
  document.getElementById('completionBar').style.width = `${percent}%`;
}

function saveProfile(event) {
  event.preventDefault();
  const current = loadProfileData();
  const profile = {
    ...current,
    name: document.getElementById('profileName').value.trim(),
    role: document.getElementById('profileRole').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    phone: document.getElementById('profilePhone').value.trim(),
    bio: document.getElementById('profileBio').value.trim(),
    photo: profilePhotoData
  };
  if (!profile.name || !profile.email) {
    showProfileToast('Add your name and a valid email address first.', true);
    return;
  }
  try {
    localStorage.setItem(adminProfileKey, JSON.stringify(profile));
    paintProfile(profile);
    document.getElementById('profileSaveStatus').textContent = 'Saved just now';
    showProfileToast('Your profile has been updated.');
  } catch (error) {
    showProfileToast('Could not save. The selected photo may be too large.', true);
  }
}

function savePreferences() {
  const profile = {
    ...loadProfileData(),
    language: document.getElementById('profileLanguage').value,
    timezone: document.getElementById('profileTimezone').value,
    productUpdates: document.getElementById('prefProductUpdates').checked,
    weeklySummary: document.getElementById('prefWeeklySummary').checked
  };
  try {
    localStorage.setItem(adminProfileKey, JSON.stringify(profile));
    document.getElementById('preferencesSaveStatus').textContent = 'Saved just now';
    showProfileToast('Your preferences have been saved.');
  } catch (error) {
    showProfileToast('Preferences could not be saved in this browser.', true);
  }
}

function previewPhoto(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showProfileToast('Choose a JPG, PNG, or WebP image.', true);
    return;
  }
  if (file.size > 512000) {
    showProfileToast('Choose an image smaller than 500 KB.', true);
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    profilePhotoData = typeof reader.result === 'string' ? reader.result : '';
    const name = document.getElementById('profileName').value || 'Nada Alawneh';
    document.getElementById('profileAvatar').textContent = initialsFor(name);
    document.getElementById('profileAvatar').classList.add('has-photo');
    document.getElementById('profileAvatar').style.backgroundImage = `url("${profilePhotoData}")`;
    showProfileToast('Photo selected. Save your profile to keep it.');
  });
  reader.addEventListener('error', () => showProfileToast('Could not read that image.', true));
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const profile = loadProfileData();
  profilePhotoData = typeof profile.photo === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(profile.photo) ? profile.photo : '';
  paintProfile(profile);

  document.getElementById('profileForm').addEventListener('submit', saveProfile);
  document.getElementById('savePreferences').addEventListener('click', savePreferences);
  document.getElementById('profilePhotoInput').addEventListener('change', event => previewPhoto(event.target.files[0]));
  document.getElementById('removePhoto').addEventListener('click', () => {
    profilePhotoData = '';
    const avatar = document.getElementById('profileAvatar');
    avatar.classList.remove('has-photo');
    avatar.style.backgroundImage = '';
    avatar.textContent = initialsFor(document.getElementById('profileName').value || 'Nada Alawneh');
    document.getElementById('profilePhotoInput').value = '';
    showProfileToast('Photo removed. Save your profile to keep the change.');
  });

  const sectionLinks = [...document.querySelectorAll('.profile-section-link')];
  const syncSectionLink = () => {
    sectionLinks.forEach(link => link.classList.toggle('is-active', link.hash === (location.hash || '#profile')));
  };
  window.addEventListener('hashchange', syncSectionLink);
  syncSectionLink();
});
