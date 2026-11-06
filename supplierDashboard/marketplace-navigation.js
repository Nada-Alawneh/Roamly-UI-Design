(function () {
  "use strict";
  var link = document.getElementById("exploreOutdoorProviders");
  if (!link) return;
  link.addEventListener("click", function (event) {
    var destination = document.getElementById("destinationSearch");
    if (!destination || !destination.value.trim()) return;
    event.preventDefault();
    var query = new URLSearchParams({ destination: destination.value.trim() });
    window.location.href = "supplierDashboard/suppliers.html?" + query.toString();
  });
}());
