document.addEventListener('DOMContentLoaded', () => {
    const subjectSelect = document.getElementById('subject');
    const topicInput = document.getElementById('topic');
    const numQuestionsInput = document.getElementById('numQuestions');
    const generateButton = document.getElementById('generateButton');
    const errorMessage = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const worksheetOutput = document.getElementById('worksheetOutput');
    const worksheetPreview = document.getElementById('worksheetPreview');
    const downloadPngButton = document.getElementById('downloadPng');
    const downloadJpgButton = document.getElementById('downloadJpg');
    const downloadPdfButton = document.getElementById('downloadPdf');
    const langHiButton = document.getElementById('langHi');
    const langEnButton = document.getElementById('langEn');

    let currentLanguage = localStorage.getItem('worksheetLang') || 'hi'; // Default to Hindi

    // Translations object for all UI text
    const translations = {
        hi: {
            mainTitle: 'वर्कशीट जेनरेटर',
            subjectLabel: 'विषय:',
            topicLabel: 'टॉपिक:',
            topicPlaceholder: 'उदाहरण: प्रकाश संश्लेषण',
            numQuestionsLabel: 'प्रश्नों की संख्या:',
            generateButtonText: 'वर्कशीट जेनरेट करें',
            errorEmptyFields: 'कृपया सभी आवश्यक फ़ील्ड भरें और प्रश्नों की संख्या 0 से अधिक रखें।',
            errorGenerationFailed: 'वर्कशीट जेनरेट करने में विफल। कृपया पुनः प्रयास करें।',
            errorFetchParse: 'वर्कशीट जेनरेट करने के दौरान एक त्रुटि हुई। सुनिश्चित करें कि आपका प्रॉम्प्ट स्पष्ट है।',
            generatingText: 'वर्कशीट जेनरेट हो रही है...',
            downloadPng: 'PNG डाउनलोड करें',
            downloadJpg: 'JPG डाउनलोड करें',
            downloadPdf: 'PDF डाउनलोड करें',
            noWorksheet: 'कोई वर्कशीट नहीं मिली जिसे डाउनलोड किया जा सके।',
            downloadImageFailed: 'इमेज डाउनलोड करने में विफल:',
            downloadPdfFailed: 'PDF डाउनलोड करने में विफल:',
            worksheetTitle: 'वर्कशीट',
            subjectDisplay: 'विषय:',
            topicDisplay: 'टॉपिक:',
            questionsHeading: 'प्रश्न:',
            answerKeyHeading: 'उत्तर कुंजी:',
            selectSubject: 'विषय चुनें',
            subjects: [
                { value: 'गणित', label: 'गणित' },
                { value: 'विज्ञान', label: 'विज्ञान' },
                { value: 'इतिहास', label: 'इतिहास' },
                { value: 'भूगोल', label: 'भूगोल' },
                { value: 'अंग्रेजी', label: 'अंग्रेजी' },
                { value: 'हिंदी', label: 'हिंदी' },
                { value: 'सामान्य ज्ञान', label: 'सामान्य ज्ञान' },
            ]
        },
        en: {
            mainTitle: 'Worksheet Generator',
            subjectLabel: 'Subject:',
            topicLabel: 'Topic:',
            topicPlaceholder: 'e.g., Photosynthesis',
            numQuestionsLabel: 'Number of Questions:',
            generateButtonText: 'Generate Worksheet',
            errorEmptyFields: 'Please fill all required fields and ensure the number of questions is greater than 0.',
            errorGenerationFailed: 'Failed to generate worksheet. Please try again.',
            errorFetchParse: 'An error occurred during worksheet generation. Ensure your prompt is clear.',
            generatingText: 'Generating Worksheet...',
            downloadPng: 'Download PNG',
            downloadJpg: 'Download JPG',
            downloadPdf: 'Download PDF',
            noWorksheet: 'No worksheet found to download.',
            downloadImageFailed: 'Failed to download image:',
            downloadPdfFailed: 'Failed to download PDF:',
            worksheetTitle: 'Worksheet',
            subjectDisplay: 'Subject:',
            topicDisplay: 'Topic:',
            questionsHeading: 'Questions:',
            answerKeyHeading: 'Answer Key:',
            selectSubject: 'Select Subject',
            subjects: [
                { value: 'गणित', label: 'Mathematics' },
                { value: 'विज्ञान', label: 'Science' },
                { value: 'इतिहास', label: 'History' },
                { value: 'भूगोल', label: 'Geography' },
                { value: 'अंग्रेजी', label: 'English' },
                { value: 'हिंदी', label: 'Hindi' },
                { value: 'सामान्य ज्ञान', label: 'General Knowledge' },
            ]
        }
    };

    // Function to update UI elements based on selected language
    const updateUIForLanguage = (lang) => {
        document.querySelector('.title').textContent = translations[lang].mainTitle;
        document.querySelector('.label[for="subject"]').textContent = translations[lang].subjectLabel;
        document.querySelector('.label[for="topic"]').textContent = translations[lang].topicLabel;
        document.getElementById('topic').placeholder = translations[lang].topicPlaceholder;
        document.querySelector('.label[for="numQuestions"]').textContent = translations[lang].numQuestionsLabel;
        document.getElementById('generateButton').textContent = translations[lang].generateButtonText;
        document.getElementById('downloadPng').textContent = translations[lang].downloadPng;
        document.getElementById('downloadJpg').textContent = translations[lang].downloadJpg;
        document.getElementById('downloadPdf').textContent = translations[lang].downloadPdf;

        // Update subject dropdown options
        subjectSelect.innerHTML = ''; // Clear existing options
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = translations[lang].selectSubject;
        subjectSelect.appendChild(defaultOption);

        translations[lang].subjects.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.value; // Value remains in Hindi/original for LLM prompt
            option.textContent = sub.label;
            subjectSelect.appendChild(option);
        });

        // Update active language button
        langHiButton.classList.remove('active');
        langEnButton.classList.remove('active');
        if (lang === 'hi') {
            langHiButton.classList.add('active');
        } else {
            langEnButton.classList.add('active');
        }

        // Re-show worksheet content if it exists, to update its language
        if (worksheetOutput.classList.contains('hidden') === false && worksheetPreview.innerHTML !== '') {
             // Temporarily parse existing content to re-render with new language labels
             const currentTitle = worksheetPreview.querySelector('.worksheet-title')?.textContent;
             const currentSubject = worksheetPreview.querySelector('.worksheet-info')?.textContent.split('|')[0].replace(translations[currentLanguage].subjectDisplay, '').trim();
             const currentTopic = worksheetPreview.querySelector('.worksheet-info')?.textContent.split('|')[1].replace(translations[currentLanguage].topicDisplay, '').trim();

             // This is a simplified re-render. A more robust solution would store the parsed JSON in a variable.
             // For now, if worksheetContent is available, use that.
             if (window.currentWorksheetData) { // Assuming we store the parsed JSON globally or in a more accessible way
                showWorksheet(window.currentWorksheetData);
             } else {
                // Fallback: just clear the worksheet if we can't re-render it properly
                hideWorksheet();
             }
        }
    };


    // Functions to manage UI state (error, loading, worksheet visibility)
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    };

    const showLoading = () => {
        loadingSpinner.classList.remove('hidden');
        generateButton.disabled = true;
        generateButton.textContent = translations[currentLanguage].generatingText;
    };

    const hideLoading = () => {
        loadingSpinner.classList.add('hidden');
        generateButton.disabled = false;
        generateButton.textContent = translations[currentLanguage].generateButtonText;
    };

    const showWorksheet = (content) => {
        worksheetOutput.classList.remove('hidden');
        worksheetPreview.innerHTML = `
            <h2 class="worksheet-title">${content.title || translations[currentLanguage].worksheetTitle}</h2>
            <p class="worksheet-info"><strong>${translations[currentLanguage].subjectDisplay}</strong> ${content.subject} | <strong>${translations[currentLanguage].topicDisplay}</strong> ${content.topic}</p>
            <hr class="worksheet-hr" />

            <h3 class="worksheet-heading">${translations[currentLanguage].questionsHeading}</h3>
            <ol class="worksheet-list">
                ${content.questions.map(q => `
                    <li>
                        ${q.text}
                    </li>
                `).join('')}
            </ol>

            <hr class="worksheet-hr" />
            <h3 class="worksheet-heading">${translations[currentLanguage].answerKeyHeading}</h3>
            <ul class="worksheet-list no-bullet">
                ${content.answerKey.map(a => `
                    <li>
                        <strong>${a.id}.</strong> ${a.answer}
                    </li>
                `).join('')}
            </ul>
        `;
        window.currentWorksheetData = content; // Store the generated data for language switching
    };

    const hideWorksheet = () => {
        worksheetOutput.classList.add('hidden');
        worksheetPreview.innerHTML = '';
        window.currentWorksheetData = null;
    };

    // Generate Worksheet button click handler
    generateButton.addEventListener('click', async () => {
        hideError();
        hideWorksheet();
        showLoading();

        const subject = subjectSelect.value;
        const topic = topicInput.value.trim();
        const numQuestions = parseInt(numQuestionsInput.value);

        if (!subject || !topic || numQuestions <= 0) {
            showError(translations[currentLanguage].errorEmptyFields);
            hideLoading();
            return;
        }

        try {
            // LLM prompt taiyar karein, content ki bhasha bhi specify karein
            const prompt = `Generate a school worksheet in ${currentLanguage === 'hi' ? 'Hindi' : 'English'} for the subject "${subject}" on the topic of "${topic}" with ${numQuestions} questions. Each question should be clear and concise. Provide the output as a JSON object with the following structure:
            {
              "title": "Worksheet Title",
              "subject": "Subject Name",
              "topic": "Topic Name",
              "questions": [
                {"id": 1, "text": "Question 1 text"},
                {"id": 2, "text": "Question 2 text"}
              ],
              "answerKey": [
                {"id": 1, "answer": "Answer 1 text"},
                {"id": 2, "answer": "Answer 2 text"}
              ]
            }`;

            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING" },
                            subject: { type: "STRING" },
                            topic: { type: "STRING" },
                            questions: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        id: { type: "NUMBER" },
                                        text: { type: "STRING" }
                                    },
                                    required: ["id", "text"]
                                }
                            },
                            answerKey: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        id: { type: "NUMBER" },
                                        answer: { type: "STRING" }
                                    },
                                    required: ["id", "answer"]
                                }
                            }
                        },
                        required: ["title", "subject", "topic", "questions", "answerKey"]
                    }
                }
            };

            const apiKey = ""; // Canvas will provide this at runtime. For Blogger, you need your own key.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText);
                showWorksheet(parsedJson);
            } else {
                showError(translations[currentLanguage].errorGenerationFailed);
                console.error("LLM response failed:", result);
            }
        } catch (err) {
            showError(translations[currentLanguage].errorFetchParse);
            console.error("Fetch or parse error:", err);
        } finally {
            hideLoading();
        }
    });

    // Download Image function (JPG/PNG)
    const downloadImage = async (format) => {
        if (!worksheetPreview.innerHTML) {
            showError(translations[currentLanguage].noWorksheet);
            return;
        }
        showLoading(); // Show loading for download
        hideError();

        try {
            const canvas = await window.html2canvas(worksheetPreview, {
                scale: 2, // Better quality for images
                useCORS: true,
                logging: true,
            });

            const imgData = canvas.toDataURL(`image/${format}`);
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `worksheet.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            showError(`${translations[currentLanguage].downloadImageFailed} ${err.message}`);
            console.error("Image download error:", err);
        } finally {
            hideLoading();
        }
    };

    // Download PDF function
    const downloadPdf = async () => {
        if (!worksheetPreview.innerHTML) {
            showError(translations[currentLanguage].noWorksheet);
            return;
        }
        showLoading(); // Show loading for download
        hideError();

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const input = worksheetPreview;

            const canvas = await window.html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            doc.save('worksheet.pdf');
        } catch (err) {
            showError(`${translations[currentLanguage].downloadPdfFailed} ${err.message}`);
            console.error("PDF download error:", err);
        } finally {
            hideLoading();
        }
    };

    // Attach download button event listeners
    downloadPngButton.addEventListener('click', () => downloadImage('png'));
    downloadJpgButton.addEventListener('click', () => downloadImage('jpeg'));
    downloadPdfButton.addEventListener('click', downloadPdf);

    // Language change event listeners
    langHiButton.addEventListener('click', () => {
        currentLanguage = 'hi';
        localStorage.setItem('worksheetLang', 'hi');
        updateUIForLanguage('hi');
        hideError();
        hideWorksheet();
    });

    langEnButton.addEventListener('click', () => {
        currentLanguage = 'en';
        localStorage.setItem('worksheetLang', 'en');
        updateUIForLanguage('en');
        hideError();
        hideWorksheet();
    });

    // Initial UI update on page load
    updateUIForLanguage(currentLanguage);
});
