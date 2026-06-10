import './__tests__/validator.test.js';
import { runAllTests } from './test-framework.js';

const success = runAllTests();
process.exit(success ? 0 : 1);
// End of file
