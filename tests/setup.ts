import { configure } from "@testing-library/dom";

// findBy* and waitFor wait up to 5s, not 1s: under load (the suite in parallel on a small machine) a picked or
// reopened image can take over a second to appear. Only the wait is longer; each test still checks the save itself.
configure({ asyncUtilTimeout: 5_000 });
