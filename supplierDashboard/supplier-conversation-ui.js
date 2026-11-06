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
        [["Travel style", tripContext.style], ["Trip length", tripContext.duration], ["Budget preference", tripContext.budget]].forEach(function (row) {
          if (!row[1]) return;
          var cell = document.createElement("div"), label = document.createElement("span"), value = document.createElement("strong");
          label.textContent = row[0]; value.textContent = row[1]; cell.appendChild(label); cell.appendChild(value); detailGrid.appendChild(cell);
        });
        detailGrid.dataset.tripContextAdded = "true";
      }
      var messages = request.messages || [], signature = JSON.stringify(messages);
      if (messagesHost.dataset.chatSignature === signature) return;
      messagesHost.dataset.chatSignature = signature;
      messagesHost.classList.add("supplier-chat-thread");
      messagesHost.replaceChildren();
      var heading = document.createElement("strong"); heading.className = "supplier-chat-heading"; heading.textContent = "Conversation with " + (request.travelerName || "traveler"); messagesHost.appendChild(heading);
      if (!messages.length) { var empty = document.createElement("p"); empty.className = "supplier-chat-empty"; empty.textContent = "No replies yet. Send a message to continue the conversation with the traveler."; messagesHost.appendChild(empty); return; }
      messages.forEach(function (message) {
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
