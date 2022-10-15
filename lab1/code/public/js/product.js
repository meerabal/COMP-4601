let reviewField = document.getElementById("reviewField");
let submitReviewButton = document.getElementById("submitReviewButton");
let urlArray = window.location.href.split("/");
let productId = urlArray[urlArray.length - 1].trim();

const submitReview = () => {
  let review = { review: reviewField.value.toString().trim() };
  let req = new XMLHttpRequest();
  req.open("POST", "/reviews/" + productId);
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      window.location.href = req.responseText;
    } else if (req.readyState == 4 && req.status == 500) {
      alert(req.responseText);
    }
  };
  req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  req.setRequestHeader("Accept", "text/html, application/json");
  req.send(JSON.stringify(review));
};

submitReviewButton.addEventListener("click", submitReview);
