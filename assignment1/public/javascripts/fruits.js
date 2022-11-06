let searchField = document.getElementById("searchField");
let searchButton = document.getElementById("searchButton");
let pageRankCheckbox = document.getElementById("pageRankCheckbox");
let numResultsField = document.getElementById("numResultsField");

const search = () => {
  let searchText = searchField.value.toString().trim();
  let pageRankCheck = pageRankCheckbox.checked;
  let numResults = Number(numResultsField.value.toString().trim());
  if (!numResults) {
    numResults = 10;
  } else if (numResults < 1) {
    numResults = 1;
  } else if (numResults > 50) {
    numResults = 50;
  }
  let searchQuery =
    "?q=" + searchText + "&boost=" + pageRankCheck + "&limit=" + numResults;
  let req = new XMLHttpRequest();
  req.open("GET", searchQuery);
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      window.location = searchQuery;
    } else if (req.readyState == 4 && req.status == 500) {
      alert(req.responseText);
    }
  };
  req.send();
};

searchButton.addEventListener("click", search);
