(function () {
  "use strict";
  var accountsKey = "roamlyLocalAccounts";
  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
  var accounts = read(accountsKey, []);
  var account = accounts.find(function (item) { return item.email === email; });
  if (!account || account.role !== "supplier") { window.location.href = "../sign-in.html"; return; }

  var profileKey = "roamlyUserProfile:" + email;
  var profile = read(profileKey, {});
  var photoData = typeof profile.avatar === "string" && /^data:image\/[^;]+;base64,/.test(profile.avatar) ? profile.avatar : "";
  var savedPhotoData = photoData;
  var toast = document.getElementById("profileToast");
  var toastMessage = document.getElementById("profileToastMessage");

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function initials(name) { return String(name || "Supplier").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase(); }
  function showToast(text, isError) {
    toastMessage.textContent = text;
    toast.classList.toggle("profile-toast--error", Boolean(isError));
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 3000);
  }
  function paint(profileData) {
    var name = account.name || "Supplier";
    var business = account.businessName || name;
    var role = "Adventure & Nature Supplier";
    var avatar = document.getElementById("profileAvatar");
    avatar.textContent = photoData ? "" : initials(name);
    avatar.classList.toggle("has-photo", Boolean(photoData));
    avatar.style.backgroundImage = photoData ? 'url("' + photoData + '")' : "";
    document.getElementById("portraitName").textContent = name;
    document.getElementById("portraitRole").textContent = role;
    document.getElementById("profileName").value = name;
    document.getElementById("profileRole").value = role;
    document.getElementById("profileEmail").value = email;
    document.getElementById("profilePhone").value = account.phone || "";
    document.getElementById("profileBusinessName").value = business;
    document.getElementById("profileBio").value = account.businessDescription || "";
    var prefs = account.preferences || {};
    document.getElementById("profileLanguage").value = prefs.language === "العربية" || prefs.language === "Arabic" ? "Arabic" : "English";
    document.getElementById("profileTimezone").value = prefs.timezone || "Asia/Amman";
    document.getElementById("prefProductUpdates").checked = prefs.supplierNews !== false;
    document.getElementById("prefWeeklySummary").checked = prefs.bookingUpdates !== false;
  }
  function initialsForProfile() {
    var profileAvatar = document.getElementById("profileAvatar");
    profileAvatar.textContent = photoData ? "" : initials(document.getElementById("profileName").value || account.name);
    profileAvatar.classList.toggle("has-photo", Boolean(photoData));
    profileAvatar.style.backgroundImage = photoData ? 'url("' + photoData + '")' : "";
  }
  function saveProfile(event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (!form.reportValidity()) return;
    account.name = form.elements.name.value.trim();
    account.phone = form.elements.phone.value.trim();
    account.businessName = form.elements.businessName.value.trim();
    account.businessDescription = form.elements.bio.value.trim();
    profile.fullName = account.name;
    profile.phone = account.phone;
    profile.avatar = photoData;
    var index = accounts.findIndex(function (item) { return item.email === email; });
    if (index >= 0) accounts[index] = account;
    try {
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      localStorage.setItem(profileKey, JSON.stringify(profile));
      savedPhotoData = photoData;
      document.getElementById("photoChangeDialog").close();
      var servicesKey = "roamly-market-services";
      var services = read(servicesKey, []);
      services.forEach(function (service) { if (service.supplierId === account.id) service.supplierName = account.businessName; });
      localStorage.setItem(servicesKey, JSON.stringify(services));
      document.getElementById("profileSaveStatus").textContent = "Saved just now";
      paint(profile);
      showToast("Your supplier profile has been updated.");
    } catch (error) { showToast("Profile could not be saved in this browser.", true); }
  }
  function savePreferences() {
    account.preferences = Object.assign({}, account.preferences || {}, {
      language: document.getElementById("profileLanguage").value,
      timezone: document.getElementById("profileTimezone").value,
      supplierNews: document.getElementById("prefProductUpdates").checked,
      bookingUpdates: document.getElementById("prefWeeklySummary").checked
    });
    var index = accounts.findIndex(function (item) { return item.email === email; });
    if (index >= 0) accounts[index] = account;
    try {
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      document.getElementById("preferencesSaveStatus").textContent = "Saved just now";
      showToast("Your preferences have been saved.");
    } catch (error) { showToast("Preferences could not be saved in this browser.", true); }
  }

  paint(profile);
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("savePreferences").addEventListener("click", savePreferences);
  document.getElementById("profilePhotoInput").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Choose an image file.", true); return; }
    var reader = new FileReader();
    reader.onload = function () { photoData = typeof reader.result === "string" ? reader.result : ""; initialsForProfile(); document.getElementById("photoChangePreview").src = photoData; document.getElementById("photoChangeDialog").showModal(); };
    reader.onerror = function () { showToast("Could not read that image.", true); };
    reader.readAsDataURL(file);
  });
  document.getElementById("savePhotoChange").addEventListener("click", function () {
    profile.avatar = photoData;
    try { localStorage.setItem(profileKey, JSON.stringify(profile)); savedPhotoData = photoData; document.getElementById("photoChangeDialog").close(); showToast("Profile photo updated."); }
    catch (error) { showToast("The photo could not be saved in this browser.", true); }
  });
  document.getElementById("removePhoto").addEventListener("click", function () {
    profile.avatar = "";
    try { localStorage.setItem(profileKey, JSON.stringify(profile)); photoData = ""; savedPhotoData = ""; document.getElementById("profilePhotoInput").value = ""; initialsForProfile(); document.getElementById("photoChangeDialog").close(); showToast("Profile photo removed."); }
    catch (error) { showToast("The photo could not be removed in this browser.", true); }
  });
  function cancelPhotoChange() { photoData = savedPhotoData; document.getElementById("profilePhotoInput").value = ""; initialsForProfile(); if (document.getElementById("photoChangeDialog").open) document.getElementById("photoChangeDialog").close(); }
  document.getElementById("cancelPhotoChange").addEventListener("click", cancelPhotoChange);
  document.getElementById("photoChangeDialog").addEventListener("close", cancelPhotoChange);
  var links = Array.from(document.querySelectorAll(".profile-section-link"));
  function syncSections() { links.forEach(function (link) { link.classList.toggle("is-active", link.hash === (location.hash || "#profile")); }); }
  window.addEventListener("hashchange", syncSections);
  syncSections();
}());
