(function () {
  "use strict";
  var host = document.getElementById("supplier-content");
  if (!host) return;

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function messageTime(value) {
    var date = new Date(value);
    return value && !isNaN(date.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date) : "";
  }
  function decorate() {
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
    var account = read("roamlyLocalAccounts", []).find(function (item) { return item.email === email; });
    var requests = read("roamly-market-requests", []);
    host.querySelectorAll(".request-accordion").forEach(function (section) {
      var form = section.querySelector("form[data-reply]"), messagesHost = section.querySelector(".request-messages");
      if (!form || !messagesHost) return;
      var request = requests.find(function (item) { return item.id === form.dataset.reply; });
      if (!request) return;
      var detailGrid = section.querySelector(".request-detail-grid"), tripContext = request.tripContext || {};
      if (detailGrid && detailGrid.dataset.requestReferenceAdded !== "true") {
        var reference = document.createElement("div"), referenceLabel = document.createElement("span"), referenceValue = document.createElement("strong");
        referenceLabel.textContent = "Request reference"; referenceValue.textContent = request.id; reference.appendChild(referenceLabel); reference.appendChild(referenceValue); detailGrid.insertBefore(reference, detailGrid.firstChild); detailGrid.dataset.requestReferenceAdded = "true";
      }
      if (detailGrid && detailGrid.dataset.tripContextAdded !== "true") {
        [["Starting point", tripContext.origin], ["Full destination", tripContext.destination], ["Travel date", tripContext.travelDate], ["Travel style", tripContext.style], ["Supplier style", tripContext.providerStyle], ["Trip length", tripContext.duration], ["Budget preference", tripContext.budget], ["Preferred pace", tripContext.tripPace], ["Experience level", tripContext.activityLevel], ["Selected activity", tripContext.experienceType], ["Traveler preferences", tripContext.notes]].forEach(function (row) {
          if (!row[1]) return;
          var cell = document.createElement("div"), label = document.createElement("span"), value = document.createElement("strong");
          label.textContent = row[0]; value.textContent = row[1]; cell.appendChild(label); cell.appendChild(value); detailGrid.appendChild(cell);
        });
        detailGrid.dataset.tripContextAdded = "true";
      }
      if (detailGrid && request.travelerConfirmedAt && detailGrid.dataset.travelerConfirmationAdded !== "true") {
        [["Traveler booking confirmation", "Confirmed"], ["Agreed price", "USD " + (Number(request.agreedPrice) || 0).toFixed(2)]].forEach(function (row) { var cell = document.createElement("div"), label = document.createElement("span"), value = document.createElement("strong"); label.textContent = row[0]; value.textContent = row[1]; cell.append(label, value); detailGrid.appendChild(cell); });
        detailGrid.dataset.travelerConfirmationAdded = "true";
      }
      if (request.tripContext && Array.isArray(request.tripContext.itinerary) && request.tripContext.itinerary.length && !section.querySelector(".request-itinerary-preview")) {
        var outline = document.createElement("details"), outlineTitle = document.createElement("summary"), outlineBody = document.createElement("div");
        outline.className = "request-itinerary-preview"; outlineTitle.textContent = "View traveler’s AI itinerary"; outlineBody.className = "request-itinerary-preview__body";
        request.tripContext.itinerary.forEach(function (day) {
          var dayCard = document.createElement("article"), heading = document.createElement("strong"), list = document.createElement("ul");
          heading.textContent = [day.title, day.date].filter(Boolean).join(" · ");
          (day.activities || []).forEach(function (activity) { var item = document.createElement("li"); item.textContent = activity; list.appendChild(item); });
          dayCard.append(heading, list); outlineBody.appendChild(dayCard);
        });
        outline.append(outlineTitle, outlineBody); detailGrid.insertAdjacentElement("afterend", outline);
      }
      var messages = request.messages || [], signature = JSON.stringify([request.message, messages]);
      if (messagesHost.dataset.chatSignature === signature) return;
      messagesHost.dataset.chatSignature = signature;
      messagesHost.classList.add("supplier-chat-thread");
      messagesHost.replaceChildren();
      var heading = document.createElement("strong"); heading.className = "supplier-chat-heading"; heading.textContent = "Conversation with " + (request.travelerName || "traveler"); messagesHost.appendChild(heading);
      var entries = [];
      if (request.message) entries.push({ from: request.travelerName || "Traveler", text: request.message, at: request.createdAt, senderRole: "traveler" });
      entries = entries.concat(messages);
      if (!entries.length) { var empty = document.createElement("p"); empty.className = "supplier-chat-empty"; empty.textContent = "No messages yet. Send a message to continue the conversation with the traveler."; messagesHost.appendChild(empty); return; }
      entries.forEach(function (message) {
        var own = message.from === (account && (account.businessName || account.name)), bubble = document.createElement("article"), top = document.createElement("div"), sender = document.createElement("strong"), time = document.createElement("time"), text = document.createElement("p");
        bubble.className = "supplier-chat-message" + (own ? " is-company" : " is-traveler") + (message.kind === "notification" ? " is-notice" : "");
        sender.textContent = own ? "Your company" : (message.from || request.travelerName || "Traveler");
        time.textContent = messageTime(message.at); if (message.at) time.dateTime = message.at;
        top.appendChild(sender); if (message.at) top.appendChild(time);
        text.textContent = message.text || ""; bubble.appendChild(top); bubble.appendChild(text); messagesHost.appendChild(bubble);
      });
    });
  }
  decorate();
  new MutationObserver(decorate).observe(host, { childList: true, subtree: true });
  window.addEventListener("storage", decorate);
}());
