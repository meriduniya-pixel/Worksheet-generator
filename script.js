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

    // Functions to manage UI state
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
        generateButton.textContent = 'वर्कशीट जेनरेट हो रही है...';
    };

    const hideLoading = () => {
        loadingSpinner.classList.add('hidden');
        generateButton.disabled = false;
        generateButton.textContent = 'वर्कशीट जेनरेट करें';
    };

    const showWorksheet = (content) => {
        worksheetOutput.classList.remove('hidden');
        worksheetPreview.innerHTML = `
            <h2 class="text-2xl font-bold text-center mb-4">${content.title || 'वर्कशीट'}</h2>
            <p class="text-md text-center mb-2"><strong>विषय:</strong> ${content.subject} | <strong>टॉपिक:</strong> ${content.topic}</p>
            <hr class="my-4 border-gray-300" />

            <h3 class="text-xl font-semibold mb-3">प्रश्न:</h3>
            <ol class="list-decimal list-inside space-y-3">
                ${content.questions.map(q => `
                    <li class="mb-2">
                        ${q.text}
                    </li>
                `).join('')}
            </ol>

            <hr class="my-4 border-gray-300" />
            <h3 class="text-xl font-semibold mb-3">उत्तर कुंजी:</h3>
            <ul class="list-none space-y-2">
                ${content.answerKey.map(a => `
                    <li>
                        <strong>${a.id}.</strong> ${a.answer}
                    </li>
                `).join('')}
            </ul>
        `;
    };

    const hideWorksheet = () => {
        worksheetOutput.classList.add('hidden');
        worksheetPreview.innerHTML = '';
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
            showError('कृपया सभी आवश्यक फ़ील्ड भरें और प्रश्नों की संख्या 0 से अधिक रखें।');
            hideLoading();
            return;
        }

        try {
            const prompt = `Generate a school worksheet for the subject "${subject}" on the topic of "${topic}" with ${numQuestions} questions. Each question should be clear and concise. Provide the output as a JSON object with the following structure:
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
                showError('वर्कशीट जेनरेट करने में विफल। कृपया पुनः प्रयास करें।');
                console.error("LLM response failed:", result);
            }
        } catch (err) {
            showError('वर्कशीट जेनरेट करने के दौरान एक त्रुटि हुई। सुनिश्चित करें कि आपका प्रॉम्प्ट स्पष्ट है।');
            console.error("Fetch or parse error:", err);
        } finally {
            hideLoading();
        }
    });

    // Download Image function (JPG/PNG)
    const downloadImage = async (format) => {
        if (!worksheetPreview.innerHTML) {
            showError('कोई वर्कशीट नहीं मिली जिसे डाउनलोड किया जा सके।');
            return;
        }
        showLoading(); // Show loading for download
        hideError();

        try {
            // html2canvas global object se access karein
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
            showError(`इमेज डाउनलोड करने में विफल: ${err.message}`);
            console.error("Image download error:", err);
        } finally {
            hideLoading();
        }
    };

    // Download PDF function
    const downloadPdf = async () => {
        if (!worksheetPreview.innerHTML) {
            showError('कोई वर्कशीट नहीं मिली जिसे डाउनलोड किया जा सके।');
            return;
        }
        showLoading(); // Show loading for download
        hideError();

        try {
            // jsPDF global object se access karein
            const { jsPDF } = window.jspdf; // jsPDF ko global object se destructure karein
            const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4 size
            const input = worksheetPreview;

            // Use html2canvas to render the content
            const canvas = await window.html2canvas(input, {
                scale: 2, // Higher scale for better PDF quality
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

            // Add image to PDF, adding new pages if content overflows
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
            showError(`PDF डाउनलोड करने में विफल: ${err.message}`);
            console.error("PDF download error:", err);
        } finally {
            hideLoading();
        }
    };

    // Attach download button event listeners
    downloadPngButton.addEventListener('click', () => downloadImage('png'));
    downloadJpgButton.addEventListener('click', () => downloadImage('jpeg'));
    downloadPdfButton.addEventListener('click', downloadPdf);
});