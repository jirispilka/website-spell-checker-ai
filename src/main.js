import { Actor } from 'apify';

await Actor.init();

// Get input of your Actor.
const { url } = await Actor.getInput();
const { maxCrawlDepth } = await Actor.getInput();
const { maxCrawlPages } = await Actor.getInput();
const { openaiApiKey } = await Actor.getInput();
const { severityLevel } = await Actor.getInput();

if (severityLevel){
    var prompt = `
Perform a spelling and grammar check on the given website.

The output should be a JSON array with these fields:
- Sentence Mistake: The sentence with the mistake.
- Sentence Corrected: The corrected version.
- Explanation: A brief explanation.
- URL: The webpage URL.
- Severity: Only 'high.'

**Instructions:**
- Include only entries with actual 'high' severity mistakes.
- If there are multiple high-severity mistakes, create a separate entry for each.
- Do not include entries for sentences without mistakes.
- Assign 'high' severity only to critical errors that impact meaning or professionalism, such as major grammatical errors or serious spelling mistakes.
- Exclude suggestions for style, clarity, sentence structure, punctuation, minor issues, and preferences.

Focus solely on errors that significantly affect understanding or convey incorrect information.
`
} else {
var prompt = `
Perform a spelling and grammar check on the given website.

The output should be a JSON array with these fields:
- Sentence Mistake: The sentence with the mistake.
- Sentence Corrected: The corrected version.
- Explanation: A brief explanation.
- URL: The webpage URL.
- Severity: Categorize each mistake as 'low,' 'medium,' or 'high.'

**Instructions:**
- Include all entries with mistakes found on the website.
- For each mistake, assign a severity level: 
  - 'Low' for minor issues with little impact on meaning.
  - 'Medium' for moderate issues that affect clarity or professionalism.
  - 'High' for critical errors that significantly impact meaning or understanding.
- If there are multiple mistakes, create a separate entry for each.
- Exclude sentences without mistakes or explanations like "No mistakes found."

Focus on accurately categorizing each mistake by its impact on the content.

`
}

console.log("Na mames ${prompt}" + prompt)

try {
    new URL(url);
} catch (_) {
    throw await Actor.fail('INVALID INPUT: Invalid URL');
}
// Create input for apify/extended-gpt-scraper
const newInput = {
    startUrls: [{ url: url }],
    includeUrlGlobs: [{glob: url.replace(/\/$/, "")  + "/**"}], //Add the global url to crawl the website
    linkSelector: "a[href]",
    maxPagesPerCrawl: maxCrawlPages,
    maxCrawlingDepth: maxCrawlDepth,
    openaiApiKey: openaiApiKey,
    pageFormatInRequest: "HTML",
    topP: "0.9",
    temperatue: "0.2",
    // openaiApiKey: process.env.OPENAI_TOKEN_SPELLING_SCRAPER, //for testing
    instructions: prompt,
    model: "gpt-4o-mini",
    schema: {
        "type": "object",
        "properties": {
            "data": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "website": {
                            "type": "string",
                            "description": "Url of the website that we are doing the spell check."
                        },
                        "sentence_mistake": {
                            "type": "string",
                            "description": "Sentence with a mistake"
                        },
                        "sentence_corrected": {
                            "type": "string",
                            "description": "Sentence without the mistake"
                        },
                        "explanation": {
                            "type": "string",
                            "description": "Explanation of the mistake"
                        },
                        "severity": {
                            "type": "string",
                            "description": "Severity of the mistake"
                        }
                    },
                    "required": [
                        "url",
                        "sentence_mistake",
                        "sentence_corrected",
                        "explanation",
                        "severity"
                    ],
                    "additionalProperties": false
                }
            }
        },
        "required": [
            "data"
        ],
        "additionalProperties": false
    },
    saveSnapshots: false,
    useStructureOutput: true,
};

console.log("ESto es: " + prompt)

// Transform the Actor run to apify/web-scraper
// with the new input.
var result = await Actor.metamorph('drobnikj/extended-gpt-scraper', newInput);
// The line here will never be reached, because the
// Actor run will be interrupted.
await Actor.exit()