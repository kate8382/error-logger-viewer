const path = require('path');
const corePath = path.join(__dirname, '..', 'node_modules', 'jest', 'node_modules', '@jest', 'core');
const { runCLI } = require(corePath);
// path already defined

(async () => {
  const root = process.cwd();
  const projects = [root];
  const argv = {
    selectProjects: ['frontend'],
    listTests: true,
    runInBand: true,
    debug: true,
  };
  const { results } = await runCLI(argv, projects);
  console.log('runCLI results keys:', Object.keys(results));
  if (results.testResults) {
    for (const tr of results.testResults) console.log(tr.testFilePath);
  }
})();
