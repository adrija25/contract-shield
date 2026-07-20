document.addEventListener("DOMContentLoaded", () => {
  const contractForm = document.getElementById("contract-form");
  const contractText = document.getElementById("contract-text");

  const MIN_CHARACTERS = 100;
  const MAX_CHARACTERS = 50000;

  if (!contractForm || !contractText) {
    console.error("Contract Shield form elements could not be found.");
    return;
  }

  contractForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = contractText.value.trim();

    if (!text) {
      alert(
        "Please paste your contract or agreement text before analyzing."
      );
      contractText.focus();
      return;
    }

    if (text.length < MIN_CHARACTERS) {
      alert(
        "The text you entered appears to be very short. Please paste at least 100 characters so Contract Shield has enough information to analyze."
      );
      contractText.focus();
      return;
    }

    if (text.length > MAX_CHARACTERS) {
      alert(
        "This contract is too long for a single analysis. Please limit your text to 50,000 characters or analyze the most relevant section."
      );
      contractText.focus();
      return;
    }

    alert(
      "Contract Shield's analysis engine is not connected yet. Your contract text has not been sent or stored anywhere."
    );
  });
});
