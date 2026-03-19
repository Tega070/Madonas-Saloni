# Workflow: Build a Simple Website

## Objective
Create a clean, functional static website for Madona's Saloni.

## Inputs Required
- Page name / purpose (e.g., homepage, services, contact)
- Design preferences (colors, fonts, layout style)
- Content (text, images, links)

## Steps

1. **Clarify requirements** — Ask what the page needs to display and any style preferences
2. **Check `tools/`** — Look for any existing HTML/CSS templates or helpers
3. **Build the page** — Write semantic HTML + CSS (and JS if needed)
4. **Review** — Confirm layout matches the intent before finalizing
5. **Deliver** — Save output to the project folder or specified location

## Output
- `.html` file in the project root or a `pages/` subfolder
- Linked `.css` stylesheet in `assets/css/`
- Any scripts in `assets/js/`

## Edge Cases
- If images are needed but not provided, use placeholder URLs or note where to insert them
- If the user wants a multi-page site, build each page as a separate workflow run and share a common stylesheet

## Notes
- Keep HTML semantic and accessible
- Mobile-first CSS by default
- No frameworks unless explicitly requested — keep it simple
