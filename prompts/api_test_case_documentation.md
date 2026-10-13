# Implementation Prompt: API Test Case Documentation

## Objective
Create concise, usable API test case documentation for the CS Blood Donation Drive Coordinator project and deliver it as a PDF saved in the project root.

## Project Context
- Backend: Express REST API in `server/server.js`.
- API base path: `/api`.
- Routes are mounted for authentication, drives, appointments, staff, analytics, notifications, and administration.
- Automated integration coverage is in `server/test_sprints.js`.
- The README documents the project’s donor, coordinator, medical staff, and administrator workflows.

## Required Deliverables
1. Create `docs/api-test-cases.md` as the editable source document.
2. Create `api-test-cases.pdf` in the project root.
3. Keep the PDF readable, professionally formatted, and consistent with the system documentation.

## Documentation Requirements
- Describe the API scope, base URL, prerequisites, authentication approach, and test data setup.
- Include a test case catalog organized by functional area: health/CORS, authentication/RBAC, drives/slot generation, appointments/concurrency, pre-screening, staff operations, analytics/CSV, notifications, and admin routes.
- For each case include a unique ID, endpoint and method, purpose, role/authentication, preconditions or test data, request inputs where relevant, expected HTTP status, and response/side-effect assertions.
- Include positive, negative, authorization, validation, and concurrency-focused scenarios where supported by the route handlers and the existing test suite.
- Document the exact concurrency guarantee: two distinct donors racing to book a capacity-one slot should yield one successful booking and one conflict, without exceeding capacity.
- Distinguish cases that are actually asserted by `server/test_sprints.js` from additional recommended cases. Do not claim that untested cases are automated or verified.
- Keep endpoint paths and methods aligned with route declarations in `server/src/routes/` and mount points in `server/server.js`. If the source code does not define a response contract or status, label it as requiring confirmation rather than inventing one.
- Do not include live credentials, secrets, or real donor health data. Use clearly marked synthetic test data.
- Add a brief execution section using the repository’s existing integration test command and explain any environment/database requirements visible in project documentation.

## Generation and Validation
- Use the available Python/reportlab runtime already present in the environment to generate the PDF; do not add project dependencies.
- Check that both deliverables exist, the PDF is non-empty, and it opens as a valid PDF.
- Keep changes limited to the requested documentation and PDF outputs; do not change API behavior or test code.
