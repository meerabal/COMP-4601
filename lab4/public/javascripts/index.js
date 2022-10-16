let searchField = document.getElementById("searchField");
let searchButton = document.getElementById("searchButton");

const search = () => {
  let searchText = searchField.value.toString().trim();
  let searchQuery = "?search=" + searchText;
  let req = new XMLHttpRequest();
  req.open("GET", "/" + searchQuery);
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      window.location = "/" + searchQuery;
    } else if (req.readyState == 4 && req.status == 500) {
      alert(req.responseText);
    }
  };
  req.send();
};

searchButton.addEventListener("click", search);
