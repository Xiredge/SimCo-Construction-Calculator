const levelInput = document.getElementById("levelInput");

//Prevents input that are not numbers
levelInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
});

//Disables the level input button until a building is selected from the dropdown
const input = document.getElementById("levelInput");
const button = document.getElementById("buildingButton");
const items = document.querySelectorAll(".dropdown-item");

//Function responsible for disabling the level input
function updateInputState() {
  if (button.textContent.trim() === "Buildings") {
    input.disabled = true;
    input.value = "";
  } else {
    input.disabled = false;
    input.focus();
  }
}

items.forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    button.textContent = this.textContent;
    updateInputState();
  });
});

//Makes sure that the input is disabled upon first opening the page
updateInputState();

//Change dropdown menu for each building selected
document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();

    //Get selected text
    const selected = this.textContent;

    //Change button text
    document.getElementById("buildingButton").textContent = selected;
    document.getElementById("selectedBuilding").value = selected;
  });
});