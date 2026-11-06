const adminProfileKey = 'roamly-admin-profile';
let profilePhotoData = '';
let savedProfilePhotoData = '';
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
    savedProfilePhotoData = profilePhotoData;
    document.getElementById('photoChangeDialog').close();
    paintProfile(profile);
    document.getElementById('profileSaveStatus').textContent = 'Saved just now';
    showProfileToast('Your profile has been updated.');
  } catch (error) {
    showProfileToast('Could not save your profile in this browser.', true);
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
  if (!file.type.startsWith('image/')) {
    showProfileToast('Choose an image file.', true);
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    profilePhotoData = typeof reader.result === 'string' ? reader.result : '';
    const name = document.getElementById('profileName').value || 'Nada Alawneh';
    document.getElementById('profileAvatar').textContent = initialsFor(name);
    document.getElementById('profileAvatar').classList.add('has-photo');
    document.getElementById('profileAvatar').style.backgroundImage = `url("${profilePhotoData}")`;
    document.getElementById('photoChangePreview').src = profilePhotoData;
    document.getElementById('photoChangeDialog').showModal();
  });
  reader.addEventListener('error', () => showProfileToast('Could not read that image.', true));
  reader.readAsDataURL(file);
}

function savePhotoChange() {
  const profile = { ...loadProfileData(), photo: profilePhotoData };
  try {
    localStorage.setItem(adminProfileKey, JSON.stringify(profile));
    savedProfilePhotoData = profilePhotoData;
    document.getElementById('photoChangeDialog').close();
    showProfileToast('Profile photo updated.');
  } catch (error) { showProfileToast('The photo could not be saved in this browser.', true); }
}

function removeProfilePhoto() {
  const profile = { ...loadProfileData(), photo: '' };
  try {
    localStorage.setItem(adminProfileKey, JSON.stringify(profile));
    profilePhotoData = '';
    savedProfilePhotoData = '';
    document.getElementById('profilePhotoInput').value = '';
    const avatar = document.getElementById('profileAvatar');
    avatar.textContent = initialsFor(document.getElementById('profileName').value || 'Nada Alawneh');
    avatar.classList.remove('has-photo');
    avatar.style.backgroundImage = '';
    document.getElementById('photoChangeDialog').close();
    showProfileToast('Profile photo removed.');
  } catch (error) { showProfileToast('The photo could not be removed in this browser.', true); }
}

function cancelPhotoChange() {
  profilePhotoData = savedProfilePhotoData;
  document.getElementById('profilePhotoInput').value = '';
  const avatar = document.getElementById('profileAvatar');
  avatar.textContent = profilePhotoData ? '' : initialsFor(document.getElementById('profileName').value || 'Nada Alawneh');
  avatar.classList.toggle('has-photo', Boolean(profilePhotoData));
  avatar.style.backgroundImage = profilePhotoData ? `url("${profilePhotoData}")` : '';
  if (document.getElementById('photoChangeDialog').open) document.getElementById('photoChangeDialog').close();
}

document.addEventListener('DOMContentLoaded', () => {
  const profile = loadProfileData();
  profilePhotoData = typeof profile.photo === 'string' && /^data:image\/[^;]+;base64,/.test(profile.photo) ? profile.photo : '';
  savedProfilePhotoData = profilePhotoData;
  paintProfile(profile);

  document.getElementById('profileForm').addEventListener('submit', saveProfile);
  document.getElementById('savePreferences').addEventListener('click', savePreferences);
  document.getElementById('profilePhotoInput').addEventListener('change', event => previewPhoto(event.target.files[0]));
  document.getElementById('savePhotoChange').addEventListener('click', savePhotoChange);
  document.getElementById('removePhoto').addEventListener('click', removeProfilePhoto);
  document.getElementById('cancelPhotoChange').addEventListener('click', cancelPhotoChange);
  document.getElementById('photoChangeDialog').addEventListener('close', cancelPhotoChange);

  const sectionLinks = [...document.querySelectorAll('.profile-section-link')];
  const syncSectionLink = () => {
    sectionLinks.forEach(link => link.classList.toggle('is-active', link.hash === (location.hash || '#profile')));
  };
  window.addEventListener('hashchange', syncSectionLink);
  syncSectionLink();
});
