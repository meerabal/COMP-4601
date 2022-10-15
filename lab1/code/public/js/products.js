let searchField = document.getElementById("searchField");
let searchButton = document.getElementById("searchButton");
let instockCheckbox = document.getElementById("instockCheckbox");
let addProductField = document.getElementById("addProductField");
let addProductButton = document.getElementById("addProductButton");

const searchProduct = () => {
  let searchText = searchField.value.toString().trim();
  let searchQuery = "?name=" + searchText;
  let instockQuery = "&instock=" + instockCheckbox.checked;
  let req = new XMLHttpRequest();
  req.open("GET", "/products/search" + searchQuery + instockQuery);
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      window.location.href = req.responseText;
    } else if (req.readyState == 4 && req.status == 500) {
      alert(req.responseText);
    }
  };
  req.send();
};

const addProduct = () => {
  let productJson = addProductField.value.toString().trim();
  let req = new XMLHttpRequest();
  req.open("POST", "/products");
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      window.location.href = req.responseText;
    } else if (req.readyState == 4 && req.status == 500) {
      alert(req.responseText);
    }
  };
  req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  req.setRequestHeader("Accept", "text/html, application/json");
  req.send(productJson); //JSON.stringify(str)
};

searchButton.addEventListener("click", searchProduct);
addProductButton.addEventListener("click", addProduct);
