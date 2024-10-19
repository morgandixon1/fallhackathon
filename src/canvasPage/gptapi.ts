import * as fs from 'fs';
import axios from 'axios';
/**
 * Sends the contents of a .txt file along with a user prompt to the OpenAI API and returns the response.
 *
 * @param filePath - The path to the .txt file.
 * @param prompt - The user's prompt/question.
 * @returns A promise that resolves to the OpenAI API's response.
 */
async function askOpenAI(filePath: string, prompt: string): Promise<string> {
    // Read the file content
    let fileContent: string;
    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (error: any) {
        console.error(`Error reading file at ${filePath}: ${error.message}`);
        return 'Failed to read the file.';
    }

    // Combine file content and prompt
    const combinedInput = `File Contents:\n${fileContent}\n\nUser Prompt:\n${prompt}`;

    // Define OpenAI API endpoint and parameters
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const apiKey = process.env.OPENAI_API_KEY || '_____APIKEY HERE_____'; // Replace with your method of storing the API key

    // Prepare the request payload
    const payload = {
        model: 'gpt-4', // You can use 'gpt-3.5-turbo' if preferred
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: combinedInput }
        ],
        max_tokens: 1500, // Adjust based on your needs
        temperature: 0.7,  // Adjust for creativity
    };

    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    // Send the request to OpenAI
    try {
        const response = await axios.post(apiUrl, payload, { headers });
        const answer = response.data.choices[0].message.content.trim();
        return answer;
    } catch (error: any) {
        if (error.response) {
            console.error(`OpenAI API Error: ${error.response.data.error.message}`);
            return `OpenAI API Error: ${error.response.data.error.message}`;
        } else {
            console.error(`Request Error: ${error.message}`);
            return `Request Error: ${error.message}`;
        }
    }
}