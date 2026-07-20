document.addEventListener("DOMContentLoaded", () => {
  const contractForm = document.getElementById("contract-form");
  const contractText = document.getElementById("contract-text");
  const contractFile = document.getElementById("contract-file");

  const MIN_CHARACTERS = 100;
  const MAX_CHARACTERS = 60000;

  const API_URL =
    "https://contract-shield-api.adrijachoudhury25.workers.dev/";

  const PDFJS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

  const PDFJS_WORKER_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

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

    .analysis-download-wrapper {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .analysis-download-button {
      display: inline-block;
      padding: 0.85rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      background: #123f46;
      color: #ffffff;
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    }

    .analysis-download-button:hover {
      opacity: 0.9;
    }

    .analysis-download-button:active {
      transform: translateY(1px);
    }

    .pdf-status {
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: #f4f7f7;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .pdf-status-error {
      background: #fff3f3;
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

      .analysis-download-button {
        width: 100%;
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

  let pdfStatus = null;

  if (contractFile) {
    pdfStatus = document.createElement("p");
    pdfStatus.className = "pdf-status";
    pdfStatus.style.display = "none";

    contractFile.insertAdjacentElement(
      "afterend",
      pdfStatus
    );

    contractFile.addEventListener("change", () => {
      const file = contractFile.files[0];

      if (!file) {
        pdfStatus.style.display = "none";
        pdfStatus.textContent = "";
        return;
      }

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        pdfStatus.style.display = "block";
        pdfStatus.className =
          "pdf-status pdf-status-error";

        pdfStatus.textContent =
          "Please select a PDF file.";

        contractFile.value = "";
        return;
      }

      pdfStatus.style.display = "block";
      pdfStatus.className = "pdf-status";

      pdfStatus.textContent =
        `Selected PDF: ${file.name}`;
    });
  }

  async function extractTextFromPDF(file) {
    if (!file) {
      throw new Error(
        "Please select a PDF file."
      );
    }

    if (pdfStatus) {
      pdfStatus.style.display = "block";
      pdfStatus.className = "pdf-status";

      pdfStatus.textContent =
        "Reading your PDF securely in your browser...";
    }

    try {
      const pdfjsLib =
        await import(PDFJS_URL);

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        PDFJS_WORKER_URL;

      const arrayBuffer =
        await file.arrayBuffer();

      const loadingTask =
        pdfjsLib.getDocument({
          data: arrayBuffer,
        });

      const pdf =
        await loadingTask.promise;

      let extractedText = "";

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        if (pdfStatus) {
          pdfStatus.textContent =
            `Reading page ${pageNumber} of ${pdf.numPages}...`;
        }

        const page =
          await pdf.getPage(pageNumber);

        const textContent =
          await page.getTextContent();

        const pageText =
          textContent.items
            .map((item) => item.str)
            .join(" ");

        extractedText +=
          `\n\n--- Page ${pageNumber} ---\n\n${pageText}`;
      }

      extractedText =
        extractedText.trim();

      if (
        !extractedText ||
        extractedText.length < MIN_CHARACTERS
      ) {
        throw new Error(
          "Contract Shield could not extract enough readable text from this PDF. The document may be scanned or image-based. For now, please paste the contract text instead."
        );
      }

      if (pdfStatus) {
        pdfStatus.textContent =
          `PDF text extracted successfully: ${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"} ready for analysis.`;
      }

      return extractedText;
    } catch (error) {
      if (pdfStatus) {
        pdfStatus.style.display = "block";

        pdfStatus.className =
          "pdf-status pdf-status-error";

        pdfStatus.textContent =
          error.message ||
          "Contract Shield could not read this PDF.";
      }

      throw error;
    }
  }

  function downloadAnalysis(analysis) {
    const disclaimer =
      "This analysis is provided for general informational purposes and is not legal advice.";

    const downloadText =
      `CONTRACT SHIELD\n\n` +
      `YOUR CONTRACT ANALYSIS\n\n` +
      `${disclaimer}\n\n` +
      `${analysis}\n\n` +
      `---\n\n` +
      `Generated by Contract Shield — A Qelvryn product`;

    const blob = new Blob(
      [downloadText],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const downloadUrl =
      URL.createObjectURL(blob);

    const downloadLink =
      document.createElement("a");

    downloadLink.href =
      downloadUrl;

    downloadLink.download =
      "contract-shield-analysis.txt";

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();

    document.body.removeChild(
      downloadLink
    );

    URL.revokeObjectURL(
      downloadUrl
    );
  }

  function displayAnalysis(analysis) {
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

    let cleanedAnalysis =
      analysis
        .replace(/^=+\s*$/gm, "")
        .replace(/^#+\s*/gm, "")
        .replace(/^---+\s*$/gm, "")
        .trim();

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

      if (
        /^ANALYSIS OF CONTRACT$/i.test(
          trimmedLine
        )
      ) {
        return;
      }

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

      if (/^[*\-•]\s+/.test(trimmedLine)) {
        const bullet =
          document.createElement("p");

        bullet.className =
          "analysis-bullet";

        bullet.textContent =
          "• " +
          trimmedLine.replace(
            /^[*\-•]\s+/,
            ""
          );

        analysisContent.appendChild(
          bullet
        );

        return;
      }

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

    const downloadWrapper =
      document.createElement("div");

    downloadWrapper.className =
      "analysis-download-wrapper";

    const downloadButton =
      document.createElement("button");

    downloadButton.type =
      "button";

    downloadButton.className =
      "analysis-download-button";

    downloadButton.textContent =
      "Download Analysis";

    downloadButton.addEventListener(
      "click",
      () => {
        downloadAnalysis(
          cleanedAnalysis
        );
      }
    );

    downloadWrapper.appendChild(
      downloadButton
    );

    resultsSection.appendChild(
      heading
    );

    resultsSection.appendChild(
      disclaimer
    );

    resultsSection.appendChild(
      analysisContent
    );

    resultsSection.appendChild(
      downloadWrapper
    );

    resultsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  contractForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const pastedText =
        contractText.value.trim();

      const selectedFile =
        contractFile &&
        contractFile.files.length > 0
          ? contractFile.files[0]
          : null;

      const submitButton =
        contractForm.querySelector(
          'button[type="submit"]'
        );

      if (
        !pastedText &&
        !selectedFile
      ) {
        alert(
          "Please upload a PDF contract or paste your contract text before analyzing."
        );

        return;
      }

      if (
        pastedText &&
        selectedFile
      ) {
        alert(
          "Please use one input method at a time: either upload a PDF or paste contract text."
        );

        return;
      }

      const originalButtonText =
        submitButton
          ? submitButton.textContent
          : "Analyze Contract";

      if (submitButton) {
        submitButton.disabled = true;

        submitButton.textContent =
          selectedFile
            ? "Reading PDF..."
            : "Analyzing...";
      }

      try {
        let textToAnalyze =
          pastedText;

        if (selectedFile) {
          textToAnalyze =
            await extractTextFromPDF(
              selectedFile
            );

          if (submitButton) {
            submitButton.textContent =
              "Analyzing...";
          }
        }

        if (
          textToAnalyze.length <
          MIN_CHARACTERS
        ) {
          throw new Error(
            "The contract text appears to be too short. Please provide at least 100 characters for analysis."
          );
        }

        if (
          textToAnalyze.length >
          MAX_CHARACTERS
        ) {
          throw new Error(
            "This contract contains more than 60,000 characters. Very large contracts are not yet supported in a single analysis."
          );
        }

        const response =
          await fetch(
            API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  contractText:
                    textToAnalyze,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Contract analysis failed."
          );
        }

        if (!data.analysis) {
          throw new Error(
            "No analysis was returned. Please try again."
          );
        }

        displayAnalysis(
          data.analysis
        );
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
          submitButton.disabled =
            false;

          submitButton.textContent =
            originalButtonText;
        }
      }
    }
  );
});
