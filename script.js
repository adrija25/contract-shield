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

    .analysis-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .analysis-action-button {
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

    .analysis-action-button:hover {
      opacity: 0.9;
    }

    .analysis-action-button:active {
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

      .analysis-actions {
        flex-direction: column;
      }

      .analysis-action-button {
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

  function cleanAnalysisText(analysis) {
    let cleaned =
      typeof analysis === "string"
        ? analysis
        : "";

    cleaned = cleaned
      .replace(/^=+\s*$/gm, "")
      .replace(/^#+\s*/gm, "")
      .replace(/^---+\s*$/gm, "")
      .replace(
        /^Do not include any headings or boilerplate language before section 1\.?\s*$/gim,
        ""
      )
      .replace(
        /^Please let me know if you want me to make any changes\.?\s*$/gim,
        ""
      )
      .replace(
        /^Let me know if you want me to make any changes\.?\s*$/gim,
        ""
      )
      .replace(
        /^The final answer is:.*$/gim,
        ""
      )
      .replace(
        /^There is no final numerical answer.*$/gim,
        ""
      )
      .replace(
        /^The solution is.*$/gim,
        ""
      )
      .replace(
        /^Step\s*([1-7])\s*:\s*/gim,
        "$1. "
      )
      .replace(
        /^Step\s*([1-7])\s*[-–—]\s*/gim,
        "$1. "
      );

    const sectionOnePattern =
      /(?:^|\n)\s*(?:1\.\s*)?PLAIN[-–—\s]?LANGUAGE\s+SUMMARY/gi;

    const sectionOneMatches = [
      ...cleaned.matchAll(sectionOnePattern),
    ];

    if (sectionOneMatches.length > 1) {
      cleaned =
        cleaned.substring(
          0,
          sectionOneMatches[1].index
        );
    }

    cleaned = cleaned
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return cleaned;
  }

  function formatReportDate() {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(new Date());
  }

  function createPrintableReport(
    cleanedAnalysis
  ) {
    const reportWindow =
      window.open(
        "",
        "_blank"
      );

    if (!reportWindow) {
      alert(
        "Your browser blocked the report window. Please allow pop-ups for Contract Shield and try again."
      );

      return;
    }

    const safeAnalysis =
      cleanedAnalysis
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const lines =
      safeAnalysis.split("\n");

    let reportBody = "";

    lines.forEach((line) => {
      const trimmedLine =
        line.trim();

      if (!trimmedLine) {
        return;
      }

      if (
        /^[1-7]\.\s+[A-Z][A-Z\s\-–—&;]+$/.test(
          trimmedLine
        )
      ) {
        reportBody +=
          `<h2>${trimmedLine}</h2>`;

        return;
      }

      if (
        /^[*\-•]\s+/.test(
          trimmedLine
        )
      ) {
        const bulletText =
          trimmedLine.replace(
            /^[*\-•]\s+/,
            ""
          );

        reportBody +=
          `<div class="report-bullet">• ${bulletText}</div>`;

        return;
      }

      if (
        /^\+\s+/.test(
          trimmedLine
        )
      ) {
        const bulletText =
          trimmedLine.replace(
            /^\+\s+/,
            ""
          );

        reportBody +=
          `<div class="report-sub-bullet">• ${bulletText}</div>`;

        return;
      }

      reportBody +=
        `<p>${trimmedLine}</p>`;
    });

    const reportDate =
      formatReportDate();

    reportWindow.document.open();

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>Contract Shield Report</title>

        <style>
          @page {
            size: A4;
            margin: 18mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family:
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Arial,
              sans-serif;
            color: #172b30;
            background: #ffffff;
            font-size: 11pt;
            line-height: 1.6;
          }

          .report {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }

          .brand {
            margin-bottom: 6px;
            font-size: 11pt;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #123f46;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 25pt;
            line-height: 1.2;
            color: #123f46;
          }

          .subtitle {
            margin: 0 0 6px;
            font-size: 13pt;
            color: #425b60;
          }

          .date {
            margin: 0;
            font-size: 9.5pt;
            color: #687b7f;
          }

          .header-line {
            margin: 22px 0 26px;
            border: 0;
            border-top: 2px solid #123f46;
          }

          h2 {
            margin:
              25px 0 10px;
            font-size: 14pt;
            line-height: 1.35;
            color: #123f46;
            page-break-after: avoid;
          }

          p {
            margin: 0 0 10px;
          }

          .report-bullet {
            position: relative;
            margin: 0 0 8px;
            padding-left: 15px;
          }

          .report-sub-bullet {
            position: relative;
            margin: 0 0 8px;
            padding-left: 28px;
          }

          .disclaimer {
            margin-top: 30px;
            padding: 14px 16px;
            background: #f3f6f6;
            border-left: 3px solid #123f46;
            font-size: 9.5pt;
            line-height: 1.55;
          }

          .disclaimer strong {
            display: block;
            margin-bottom: 4px;
          }

          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #d9e1e2;
            font-size: 9pt;
            color: #687b7f;
          }

          .print-note {
            margin-bottom: 20px;
            padding: 12px 14px;
            background: #f3f6f6;
            border-radius: 6px;
            font-size: 10pt;
          }

          .print-button {
            display: inline-block;
            margin-top: 8px;
            padding: 9px 14px;
            border: 0;
            border-radius: 6px;
            background: #123f46;
            color: #ffffff;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
          }

          @media print {
            .print-note {
              display: none;
            }

            h2 {
              break-after: avoid;
            }

            p,
            .report-bullet,
            .report-sub-bullet {
              orphans: 3;
              widows: 3;
            }
          }
        </style>
      </head>

      <body>

        <div class="report">

          <div class="print-note">
            Your Contract Shield report is ready.
            Choose <strong>Save as PDF</strong> in the print window
            to save a PDF copy.

            <br>

            <button
              class="print-button"
              onclick="window.print()"
            >
              Save / Print PDF
            </button>
          </div>

          <div class="brand">
            QELVRYN
          </div>

          <h1>
            Contract Shield
          </h1>

          <p class="subtitle">
            Contract Analysis Report
          </p>

          <p class="date">
            Generated ${reportDate}
          </p>

          <hr class="header-line">

          ${reportBody}

          <div class="disclaimer">
            <strong>
              Important information
            </strong>

            This report is provided for general informational
            purposes to help you better understand the agreement.
            It does not constitute legal advice, determine whether
            any contract or clause is legally valid or enforceable,
            or recommend whether you should sign an agreement.
            For advice about your specific circumstances, consider
            consulting a qualified legal professional.
          </div>

          <div class="footer">
            Generated by Contract Shield — A Qelvryn product
          </div>

        </div>

      </body>
      </html>
    `);

    reportWindow.document.close();

    reportWindow.focus();

    setTimeout(() => {
      reportWindow.print();
    }, 500);
  }

  function displayAnalysis(analysis) {
    let resultsSection =
      document.getElementById(
        "contract-analysis-results"
      );

    if (!resultsSection) {
      resultsSection =
        document.createElement(
          "section"
        );

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

    const cleanedAnalysis =
      cleanAnalysisText(
        analysis
      );

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

      if (
        /^[*\-•]\s+/.test(
          trimmedLine
        )
      ) {
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

      if (
        /^\+\s+/.test(
          trimmedLine
        )
      ) {
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

    const actions =
      document.createElement("div");

    actions.className =
      "analysis-actions";

    const pdfButton =
      document.createElement("button");

    pdfButton.type =
      "button";

    pdfButton.className =
      "analysis-action-button";

    pdfButton.textContent =
      "Download PDF Report";

    pdfButton.addEventListener(
      "click",
      () => {
        createPrintableReport(
          cleanedAnalysis
        );
      }
    );

    actions.appendChild(
      pdfButton
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
      actions
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
