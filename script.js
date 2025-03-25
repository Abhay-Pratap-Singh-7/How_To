document.addEventListener('DOMContentLoaded', () => {
    // Create audio objects
    const enterSound = new Audio('music/Enter.wav');
    const searchingSound = new Audio('music/Searching.mp3');
    
    const problemForm = document.getElementById('problem-form');
    const problemInput = problemForm.querySelector('textarea');
    const submitButton = problemForm.querySelector('button[type="submit"]');
    const resultsContainer = document.getElementById('results');
    const container = document.querySelector('.container');
    const header = document.querySelector('header h1');
    
    // Set greeting
    function setGreeting() {
        header.textContent = "Good Evening, Abhay";
    }
    
    // Initialize greeting
    setGreeting();
    
    // Focus the textarea when the page loads
    setTimeout(() => {
        problemInput.focus();
    }, 500);
    
    // Submit form when Enter is pressed
    problemInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!submitButton.disabled) {
                enterSound.play(); // Play enter sound
                problemForm.dispatchEvent(new Event('submit'));
            }
        }
    });
    
    // Enable/disable submit button based on textarea content
    problemInput.addEventListener('input', () => {
        submitButton.disabled = !problemInput.value.trim();
    });
    
    // Handle form submission
    problemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const problem = problemInput.value.trim();
        
        if (!problem) return;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading active';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        resultsContainer.appendChild(loadingDiv);
        
        // Start playing searching sound
        searchingSound.play();
        
        // Make container show we have results (will move search up)
        document.body.style.overflow = 'hidden'; // Prevent scrolling during transition
        
        // Apply transitions with a slight delay to make them more fluid
        setTimeout(() => {
            container.classList.add('has-results');
            resultsContainer.classList.add('active');
            
            // Re-enable scrolling after transition
            setTimeout(() => {
                document.body.style.overflow = '';
            }, 1000); // Match the transition duration
        }, 50);
        
        // Add the query question at the top
        const queryDiv = document.createElement('div');
        queryDiv.className = 'query';
        queryDiv.textContent = problem;
        resultsContainer.appendChild(queryDiv);
        
        try {
            // Make API call to Flask server
            const response = await fetch('/api/get-steps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({ query: problem })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Remove loading indicator
            loadingDiv.remove();
            
            // Stop searching sound
            searchingSound.pause();
            searchingSound.currentTime = 0;
            
            // Create all steps first but keep them invisible
            const stepElements = [];
            data.steps.forEach((step, index) => {
                const stepElement = createStepElement(index + 1, step, problem);
                resultsContainer.appendChild(stepElement);
                stepElements.push(stepElement);
            });
            
            // Small delay before starting the animation sequence
            setTimeout(() => {
                // Animate steps one by one with a faster transition
                stepElements.forEach((stepElement, index) => {
                    setTimeout(() => {
                        stepElement.classList.add('visible');
                        // Create new audio object for each step to allow multiple sounds
                        const stepSound = new Audio('music/step.wav');
                        stepSound.play();
                    }, index * 250); // Faster animation between steps
                });
            }, 500);
            
        } catch (error) {
            // Remove loading indicator
            loadingDiv.remove();
            
            // Stop searching sound
            searchingSound.pause();
            searchingSound.currentTime = 0;
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = error.message || 'Sorry, there was an error generating steps. Please try again.';
            resultsContainer.appendChild(errorDiv);
            console.error('Error:', error);
        }
        
        // Clear input after submission
        problemInput.value = '';
        submitButton.disabled = true;
    });
    
    // Function to create a step element
    function createStepElement(number, content, context) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'step-number';
        numberDiv.textContent = `Step ${number}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'step-content';
        contentDiv.textContent = content;
        
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'step-explanation';
        explanationDiv.style.display = 'none';
        
        stepDiv.appendChild(numberDiv);
        stepDiv.appendChild(contentDiv);
        stepDiv.appendChild(explanationDiv);
        
        // Add click handler for explanation
        stepDiv.addEventListener('click', async () => {
            if (explanationDiv.style.display === 'none') {
                // Show loading state
                explanationDiv.innerHTML = '<div class="loading active"><span></span><span></span><span></span></div>';
                explanationDiv.style.display = 'block';
                
                try {
                    const response = await fetch('/api/explain-step', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            step: content,
                            context: context
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    // Update explanation with content
                    explanationDiv.innerHTML = data.explanation;
                } catch (error) {
                    explanationDiv.innerHTML = 'Sorry, there was an error getting the explanation. Please try again.';
                    console.error('Error:', error);
                }
            } else {
                // Toggle explanation visibility
                explanationDiv.style.display = 'none';
            }
        });
        
        return stepDiv;
    }
}); 