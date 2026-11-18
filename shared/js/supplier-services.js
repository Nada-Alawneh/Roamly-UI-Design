(function () {
  "use strict";
  const categories = [
    { id:"hiking", name:"Hiking & Trail Companies", icon:"fa-person-hiking", examples:"Local guides, mountain hiking routes, cave exploration" },
    { id:"equipment", name:"Outdoor Equipment Rentals", icon:"fa-person-biking", examples:"Camping kits, bicycles, climbing gear, kayaks" },
    { id:"sports", name:"Water & Adventure Sports", icon:"fa-water", examples:"Rafting, zip-line, kayaking, training sessions" },
    { id:"reserves", name:"Nature Reserves & Campsites", icon:"fa-tree", examples:"Park tickets, safari tours, campsites and cabins" },
    { id:"transport", name:"Specialized Transport", icon:"fa-truck-pickup", examples:"4x4 desert trips, remote-area transport, speedboats" }
  ];
  const serviceTypes = {
    hiking:["Local tourist guides","Organizing mountain hiking routes","Cave and valley exploration tours"],
    equipment:["Camping equipment rental","Mountain bike rental","Climbing gear rental","Kayak rental"],
    sports:["Rafting trips","Zip-line sessions","Kayaking tours","Outdoor training"],
    reserves:["Nature reserve entry","Safari tours","Campsite booking","Cabin stays"],
    transport:["4x4 desert trips","Remote area transfers","Speedboat rental"]
  };
  function normalizeType(type) {
    if (type === "Mountain hiking routes") return "Organizing mountain hiking routes";
    if (type === "Cave exploration tours") return "Cave and valley exploration tours";
    return type;
  }
  window.RoamlySupplierServices = { categories, serviceTypes, normalizeType };
})();
