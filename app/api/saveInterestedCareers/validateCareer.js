import axios from 'axios';

export const maxDuration = 40; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

export async function validateCareer(career) {
    console.log('Validating career:', career);
    // const validationPrompt = `Is "${career}" a valid career name? If yes, provide a brief description of this career and whether it has associated information available. Respond with JSON containing "is_valid" and "description" fields.`;

    // Check for invalid input
    if (!career || career.trim().length < 2 || /[^a-zA-Z\s]/.test(career)) {
        return { isValid: false, correctedName: null, message: "Input seems to be invalid. Please try again" };
    }

    const validationPrompt = `
    If the career name "${career}" is correct, return true for "is_valid" and the same name as "career_name".
    If the name is misspelled return true for "is_valid" and provide the corrected spelling as "career_name".
    If the name is not recognized, return false for "is_valid" and an empty string for "career_name".
    Only respond with JSON in the following structure:
    {
        "is_valid": boolean,
        "career_name": string
    }
`;



    let validationResponseText;

    try {
        const validationResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini", // or 'gpt-4' if you have access
                messages: [{ role: "user", content: validationPrompt }],
                max_tokens: 500, // Adjust the token limit as needed
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        validationResponseText = validationResponse.data.choices[0].message.content.trim();
        validationResponseText = validationResponseText.replace(/```json|```/g, "").trim();
        console.log(validationResponseText)
        
    } catch (error) {
        throw new Error("Failed to validate career name");
    }

    let validationParsedData;
    try {
        validationParsedData = JSON.parse(validationResponseText);

        if (!validationParsedData.is_valid) {
            return { isValid: false, message: "Invalid career name provided" };
        }

        return { isValid: true, career_name: validationParsedData.career_name };

    } catch (error) {
        throw new Error("Failed to parse validation response data");
    }
}
