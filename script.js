document.addEventListener("DOMContentLoaded", () => {
  const contractForm = document.getElementById("contract-form");
  const contractText = document.getElementById("contract-text");

  const MIN_CHARACTERS = 100;
  const MAX_CHARACTERS = 30000;

  const API_URL =
    "https://contract-shield-api.adrijachoudhury25.workers.dev/";

  // Add Contract Shield analysis styles directly from JavaScript
  const analysisStyles = document.createElement("style");

  analysisStyles.textContent = `
    .analysis-results {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .analysis-content {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      white-space: normal;
      overflow-wrap: anywhere;
      word-wrap: break-word;
      word-break: normal;
      font-family: inherit;
      line-height: 1.7;
      color: inherit;
    }

    .analysis-content p {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      white-space: normal;
      overflow-wrap: anywhere;
      word-wrap: break-word;
    }

    .analysis-paragraph {
      margin: 0 0 1rem;
      line-height: 1.7;
    }

    .analysis-section-heading {
      width: 100%;
      max-width: 100%;
      margin: 2rem 0 1rem;
      font-family: inherit;
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.4;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .analysis-bullet {
      margin: 0 0 0.7rem;
      padding-left: 0.25rem;
      line-height: 1.7;
    }

    .analysis-sub-bullet {
      margin: 0 0 0.7rem;
      padding-left: 1.5rem;
      line-height: 1.7;
    }

    .analysis-disclaimer {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .analysis-results {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .analysis-section-heading {
        font-size: 1.05rem;
      }

      .analysis-sub-bullet {
        padding-left: 1rem;
      }
    }
  `;

  document.head.appendChild(analysisStyles);

  if (!contractForm || !contractText) {
    console.error(
      "Contract Shield form elements could not be found."
    );
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
        document.getElementById(
          "contract-analysis-results"
        );

      if (!resultsSection) {
        resultsSection =
          document.createElement("section");

        resultsSection.id =
          "contract-analysis-results";

        resultsSection.className =
          "analysis-results";

        contractForm.insertAdjacentElement(
          "afterend",
          resultsSection
        );
      }

      // Clear any previous analysis before displaying
      // the newly generated analysis
      resultsSection.innerHTML = "";

      const heading =
        document.createElement("h2");

      heading.textContent =
        "Your Contract Analysis";

      const disclaimer =
        document.createElement("p");

      disclaimer.className =
        "analysis-disclaimer";

      disclaimer.textContent =
        "This analysis is provided for general informational purposes and is not legal advice.";

      const analysisContent =
        document.createElement("div");

      analysisContent.className =
        "analysis-content";

      // Clean raw formatting characters
      let cleanedAnalysis = data.analysis
        .replace(/^=+\s*$/gm, "")
        .replace(/^#+\s*/gm, "")
        .trim();

      /*
       * If the AI accidentally starts generating the entire
       * report again, remove everything after the second
       * occurrence of section 1.
       *
       * This prevents repeated cycles of sections 1–7
       * from appearing in the UI.
       */
      const sectionOnePattern =
        /1\.\s+PLAIN[-–—\s]?LANGUAGE\s+SUMMARY/gi;

      const sectionOneMatches = [
        ...cleanedAnalysis.matchAll(
          sectionOnePattern
        ),
      ];

      if (sectionOneMatches.length > 1) {
        cleanedAnalysis =
          cleanedAnalysis
            .substring(
              0,
              sectionOneMatches[1].index
            )
            .trim();
      }

      const lines =
        cleanedAnalysis.split("\n");

      lines.forEach((line) => {
        const trimmedLine =
          line.trim();

        if (!trimmedLine) {
          return;
        }

        // Remove standalone repeated report titles
        if (
          /^ANALYSIS OF CONTRACT$/i.test(
            trimmedLine
          )
        ) {
          return;
        }

        // Detect numbered Contract Shield headings
        if (
          /^[1-7]\.\s+[A-Z][A-Z\s\-–—&]+$/.test(
            trimmedLine
          )
        ) {
          const sectionHeading =
            document.createElement("h3");

          sectionHeading.className =
            "analysis-section-heading";

          sectionHeading.textContent =
            trimmedLine;

          analysisContent.appendChild(
            sectionHeading
          );

          return;
        }

        // Main bullet points
        if (/^\*\s+/.test(trimmedLine)) {
          const bullet =
            document.createElement("p");

          bullet.className =
            "analysis-bullet";

          bullet.textContent =
            "• " +
            trimmedLine.replace(
              /^\*\s+/,
              ""
            );

          analysisContent.appendChild(
            bullet
          );

          return;
        }

        // Secondary bullet points
        if (/^\+\s+/.test(trimmedLine)) {
          const subBullet =
            document.createElement("p");

          subBullet.className =
            "analysis-sub-bullet";

          subBullet.textContent =
            "• " +
            trimmedLine.replace(
              /^\+\s+/,
              ""
            );

          analysisContent.appendChild(
            subBullet
          );

          return;
        }

        // Standard paragraph
        const paragraph =
          document.createElement("p");

        paragraph.className =
          "analysis-paragraph";

        paragraph.textContent =
          trimmedLine;

        analysisContent.appendChild(
          paragraph
        );
      });

      resultsSection.appendChild(
        heading
      );

      resultsSection.appendChild(
        disclaimer
      );

      resultsSection.appendChild(
        analysisContent
      );

      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error(
        "Contract Shield analysis error:",
        error
      );

      alert(
        error.message ||
          "Contract analysis failed. Please try again."
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        submitButton.textContent =
          originalButtonText;
      }
    }
  });
});
