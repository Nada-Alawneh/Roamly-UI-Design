(function () {
  var email = (sessionStorage.getItem('roamlySignedInEmail') || localStorage.getItem('roamlySignedInEmail') || '').toLowerCase();
  var accounts = [];
  try { accounts = JSON.parse(localStorage.getItem('roamlyLocalAccounts') || '[]'); } catch (error) {}
  var account = accounts.find(function (item) { return item.email === email; });
  if (!account || account.role !== 'supplier') {
    window.location.replace('../sign-in.html');
    return;
  }

  var activitiesKey = 'roamlySupplierActivities:' + email;
  var requestsKey = 'roamlySupplierRequests:' + email;
  var activityForm = document.getElementById('supplier-activity-form');
  var feedback = document.getElementById('supplier-feedback');
  var specialtyDetails = {
    'Hiking and Guided Trails': { description: 'Provide guides, organize mountain hiking routes, and offer cave or valley exploration tours.', services: ['Local hiking guides', 'Mountain trail organization', 'Cave exploration tours', 'Valley exploration tours'] },
    'Outdoor Equipment Rental': { description: 'Rent camping equipment such as tents and sleeping bags, alongside mountain bikes, climbing gear, and kayaks.', services: ['Tents and sleeping bags', 'Mountain bike rental', 'Climbing equipment', 'Kayak rental'] },
    'Water and Air Sports Center': { description: 'Offer reservations and training sessions for diving, paragliding, skydiving, zipline, and river rafting.', services: ['Diving', 'Paragliding', 'Skydiving', 'Zipline', 'River rafting'] },
    'Nature Reserves and Eco Camps': { description: 'Issue entry tickets to national nature reserves, organize wildlife safari tours, and offer eco camps or equipped tents.', services: ['Nature reserve tickets', 'Wildlife safari tours', 'Eco camp stays', 'Equipped tents'] },
    '4x4 and Boat Transport': { description: 'Organize 4x4 off-road desert trips and offer speedboat rentals for sea excursions.', services: ['4x4 desert trips', 'Off-road transport', 'Speedboat rental', 'Sea excursions'] }
  };

  function statusLabel(status) {
    return status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending review';
  }
  function renderStatus() {
    var accounts = read('roamlyLocalAccounts');
    account = accounts.find(function (item) { return item.email === email && item.role === 'supplier'; });
    if (!account) {
      window.location.replace('../sign-in.html');
      return false;
    }
    var status = account.status || 'pending';
    var specialtyKey = account.supplierType || 'Water and Air Sports Center';
    var specialty = specialtyDetails[specialtyKey] ? specialtyKey : 'Water and Air Sports Center';
    var specialtyInfo = specialtyDetails[specialty];
    document.getElementById('supplier-business').textContent = (account.businessName || account.name) + ' · ' + specialty;
    var specialtyContainer = document.getElementById('supplier-specialty-details');
    specialtyContainer.replaceChildren();
    var summary = el('p', 'supplier-specialty__summary', specialtyInfo.description);
    var serviceList = el('div', 'supplier-specialty__services');
    specialtyInfo.services.forEach(function (service) {
      var chip = el('span', 'supplier-specialty__service');
      var icon = document.createElement('i');
      icon.className = 'fa-solid fa-check';
      chip.appendChild(icon);
      chip.appendChild(document.createTextNode(service));
      serviceList.appendChild(chip);
    });
    specialtyContainer.append(summary, serviceList);
    var panel = document.getElementById('supplier-status-panel');
    var badge = document.getElementById('supplier-status-badge');
    var icon = document.getElementById('supplier-status-icon');
    var message = document.getElementById('supplier-status-message');
    var updated = document.getElementById('supplier-status-updated');
    var historyList = document.getElementById('supplier-status-history');
    document.getElementById('supplier-tools').hidden = status !== 'approved';
    panel.className = 'supplier-status-panel supplier-status-panel--' + status;
    badge.textContent = statusLabel(status);
    icon.innerHTML = status === 'approved' ? '<i class="fa-solid fa-circle-check"></i>' : status === 'rejected' ? '<i class="fa-solid fa-circle-xmark"></i>' : '<i class="fa-solid fa-hourglass-half"></i>';
    message.textContent = account.statusReason || (status === 'approved' ? 'Your supplier account is approved. You can manage your activities and booking requests below.' : status === 'rejected' ? 'Your application was declined. Please contact Roamly support if you need more information.' : 'Your application is waiting for review by the Roamly team.');
    updated.textContent = account.statusUpdatedAt ? 'Last updated: ' + new Date(account.statusUpdatedAt).toLocaleString() : status === 'pending' ? 'Your application is in the review queue.' : 'No status update date is available.';
    historyList.replaceChildren();
    var history = Array.isArray(account.statusHistory) ? account.statusHistory.slice().reverse() : [];
    if (!history.length) history.push({ status: status, reason: account.statusReason || message.textContent, updatedAt: account.statusUpdatedAt || account.createdAt || '' });
    history.forEach(function (entry) {
      var item = el('article', 'supplier-status-history__item');
      var heading = el('strong', '', statusLabel(entry.status));
      var note = el('p', '', entry.reason || (entry.status === 'approved' ? 'Supplier access approved.' : entry.status === 'rejected' ? 'Application declined.' : 'Application is being reviewed.'));
      var date = el('time', '', entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'Date unavailable');
      item.append(heading, note, date);
      historyList.appendChild(item);
    });
    return status === 'approved';
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (error) { return []; }
  }
  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function render() {
    var activities = read(activitiesKey);
    var requests = read(requestsKey);
    document.getElementById('supplier-activity-count').textContent = activities.length;
    document.getElementById('supplier-published-count').textContent = activities.filter(function (item) { return item.published; }).length;
    document.getElementById('supplier-request-count').textContent = requests.filter(function (item) { return item.status === 'New'; }).length;
    var activityList = document.getElementById('supplier-activities');
    activityList.replaceChildren();
    if (!activities.length) activityList.appendChild(el('p', 'supplier-empty', 'No activities yet. Add your first experience to get started.'));
    activities.forEach(function (item) {
      var row = el('article', 'supplier-item');
      var info = el('div');
      info.append(el('p', 'supplier-item__title', item.title), el('p', 'supplier-item__meta', item.type + ' · ' + item.destination + ' · ' + item.category + ' · $' + Number(item.price).toFixed(2) + ' per person'));
      var actions = el('div', 'supplier-item__actions');
      actions.appendChild(el('span', 'supplier-status', item.published ? 'Published' : 'Draft'));
      var toggle = el('button', '', item.published ? 'Unpublish' : 'Publish');
      toggle.type = 'button'; toggle.dataset.activityToggle = item.id;
      var remove = el('button', '', 'Remove');
      remove.type = 'button'; remove.dataset.activityRemove = item.id;
      actions.append(toggle, remove); row.append(info, actions); activityList.appendChild(row);
    });
    var requestList = document.getElementById('supplier-requests');
    requestList.replaceChildren();
    if (!requests.length) requestList.appendChild(el('p', 'supplier-empty', 'No booking requests yet. New requests for your activities will appear here.'));
    requests.forEach(function (item) {
      var row = el('article', 'supplier-item');
      var info = el('div');
      info.append(el('p', 'supplier-item__title', item.activity || 'Activity request'), el('p', 'supplier-item__meta', (item.traveler || 'Traveler') + ' · ' + (item.date || 'Date not specified') + ' · ' + (item.travelers || 1) + ' traveler(s)'));
      row.append(info, el('span', 'supplier-status', item.status || 'New'));
      if (!item.status || item.status === 'New') {
        var actions = el('div', 'supplier-item__actions');
        ['Accepted', 'Declined'].forEach(function (status) { var button = el('button', '', status); button.type = 'button'; button.dataset.requestId = item.id; button.dataset.requestStatus = status; actions.appendChild(button); });
        row.appendChild(actions);
      }
      requestList.appendChild(row);
    });
  }

  activityForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!renderStatus()) return;
    var data = new FormData(activityForm);
    var activities = read(activitiesKey);
    activities.unshift({ id: Date.now().toString(36), title: String(data.get('title')).trim(), type: data.get('type'), destination: String(data.get('destination')).trim(), price: Number(data.get('price')), category: data.get('category'), published: false });
    localStorage.setItem(activitiesKey, JSON.stringify(activities));
    activityForm.reset();
    feedback.textContent = 'Activity saved as a draft. Publish it when it is ready.';
    render();
  });
  document.getElementById('supplier-activities').addEventListener('click', function (event) {
    if (!renderStatus()) return;
    var toggle = event.target.closest('[data-activity-toggle]');
    var remove = event.target.closest('[data-activity-remove]');
    var activities = read(activitiesKey);
    if (toggle) activities.forEach(function (item) { if (item.id === toggle.dataset.activityToggle) item.published = !item.published; });
    if (remove) activities = activities.filter(function (item) { return item.id !== remove.dataset.activityRemove; });
    localStorage.setItem(activitiesKey, JSON.stringify(activities));
    render();
  });
  document.getElementById('supplier-requests').addEventListener('click', function (event) {
    if (!renderStatus()) return;
    var button = event.target.closest('[data-request-id]');
    if (!button) return;
    var requests = read(requestsKey);
    requests.forEach(function (item) { if (item.id === button.dataset.requestId) item.status = button.dataset.requestStatus; });
    localStorage.setItem(requestsKey, JSON.stringify(requests));
    render();
  });
  window.addEventListener('storage', function (event) {
    if (event.key === 'roamlyLocalAccounts') {
      if (renderStatus()) render();
    }
  });
  document.querySelector('[data-supplier-logout]').addEventListener('click', function () {
    sessionStorage.removeItem('roamlySignedInEmail');
    localStorage.removeItem('roamlySignedInEmail');
    window.location.href = '../index.html';
  });
  renderStatus();
  render();
}());
