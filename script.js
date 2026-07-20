document.addEventListener("DOMContentLoaded", () => {
  const contractForm = document.getElementById("contract-form");
  const contractText = document.getElementById("contract-text");

  const MIN_CHARACTERS = 100;
  const MAX_CHARACTERS = 30000;

  const API_URL =
    "https://contract-shield-api.adrijachoudhury25.workers.dev/";

  if (!contractForm || !contractText) {
    console.error("Contract Shield form elements could not be found.");
    return;
  }

  contractForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = contractText.value.trim();
    const submitButton = contractForm.querySelector(
      'button[type="submit"]'
    );

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
        "This contract is too long for a single analysis. Please limit your text to 30,000 characters or analyze the most relevant section."
      );
      contractText.focus();
      return;
    }

    const originalButtonText = submitButton
      ? submitButton.textContent
      : "Analyze Contract";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Analyzing...";
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractText: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Contract analysis failed."
        );
      }

      if (!data.analysis) {
        throw new Error(
          "No analysis was returned. Please try again."
        );
      }

      let resultsSection =
        document.getElementById("contract-analysis-results");

      if (!resultsSection) {
        resultsSection = document.createElement("section");
        resultsSection.id = "contract-analysis-results";
        resultsSection.className = "analysis-results";

        contractForm.insertAdjacentElement(
          "afterend",
          resultsSection
        );
      }

      resultsSection.innerHTML = "";

      const heading = document.createElement("h2");
      heading.textContent = "Your Contract Analysis";

      const disclaimer = document.createElement("p");
      disclaimer.className = "analysis-disclaimer";
      disclaimer.textContent =
        "This analysis is provided for general informational purposes and is not legal advice.";

      const analysisContent = document.createElement("pre");
      analysisContent.className = "analysis-content";
      analysisContent.textContent = data.analysis;

      resultsSection.appendChild(heading);
      resultsSection.appendChild(disclaimer);
      resultsSection.appendChild(analysisContent);

      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Contract Shield analysis error:", error);

      alert(
        error.message ||
          "Contract analysis failed. Please try again."
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
});
