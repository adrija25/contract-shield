document.addEventListener("DOMContentLoaded", () => {
  const contractForm = document.getElementById("contract-form");
  const contractText = document.getElementById("contract-text");

  if (!contractForm || !contractText) {
    return;
  }

  contractForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = contractText.value.trim();

    if (!text) {
      alert("Please paste your contract or agreement text before analyzing.");
      contractText.focus();
      return;
    }

    if (text.length < 100) {
      alert(
        "The text you entered appears to be very short. Please paste a larger section of the contract so Contract Shield has enough information to analyze."
      );
      contractText.focus();
      return;
    }

    alert(
      "Contract analysis is not connected yet. Your text has not been sent or stored anywhere."
    );
  });
});
