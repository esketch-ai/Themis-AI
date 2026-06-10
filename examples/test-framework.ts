// Color constants for highly aesthetic terminal output
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
}

interface SuiteResult {
  name: string;
  tests: TestResult[];
}

const suites: SuiteResult[] = [];
let currentSuite: SuiteResult | null = null;

export function describe(name: string, fn: () => void) {
  const suite: SuiteResult = { name, tests: [] };
  suites.push(suite);
  
  const previousSuite = currentSuite;
  currentSuite = suite;
  
  fn();
  
  currentSuite = previousSuite;
}

export function test(name: string, fn: () => void | Promise<void>) {
  if (!currentSuite) {
    throw new Error('Test must be defined inside a describe block');
  }
  
  const testRecord: TestResult = { name, passed: false };
  currentSuite.tests.push(testRecord);
  
  try {
    const res = fn();
    if (res instanceof Promise) {
      // Async test handling (optional for this context, but supported)
      throw new Error('Async tests not fully supported in simple sync runner');
    }
    testRecord.passed = true;
  } catch (error) {
    testRecord.passed = false;
    testRecord.error = error as Error;
  }
}

class Expectation<T> {
  constructor(private value: T) {}

  toBe(expected: T) {
    if (this.value !== expected) {
      throw new Error(`Expected ${this.value} to be ${expected}`);
    }
  }

  toEqual(expected: any) {
    const valJson = JSON.stringify(this.value);
    const expJson = JSON.stringify(expected);
    if (valJson !== expJson) {
      throw new Error(`Expected ${valJson} to equal ${expJson}`);
    }
  }

  toBeCloseTo(expected: number, delta: number = 0.001) {
    if (typeof this.value !== 'number') {
      throw new Error(`Value ${this.value} is not a number`);
    }
    if (Math.abs((this.value as number) - expected) > delta) {
      throw new Error(`Expected ${this.value} to be close to ${expected} (within delta ${delta})`);
    }
  }

  toBeTruthy() {
    if (!this.value) {
      throw new Error(`Expected ${this.value} to be truthy`);
    }
  }

  toBeFalsy() {
    if (this.value) {
      throw new Error(`Expected ${this.value} to be falsy`);
    }
  }

  toBeGreaterThan(limit: number) {
    if (typeof this.value !== 'number') {
      throw new Error(`Value ${this.value} is not a number`);
    }
    if ((this.value as number) <= limit) {
      throw new Error(`Expected ${this.value} to be greater than ${limit}`);
    }
  }
}

export function expect<T>(value: T) {
  return new Expectation(value);
}

/**
 * Runs all suites and outputs a gorgeous report.
 */
export function runAllTests(): boolean {
  console.log(`\n${BOLD}${CYAN}🚀 Executing Citizen Routing QAQC Test Runner${RESET}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  suites.forEach(suite => {
    console.log(`${BOLD}${MAGENTA}Suite: ${suite.name}${RESET}`);
    
    suite.tests.forEach(testRecord => {
      totalTests++;
      if (testRecord.passed) {
        passedTests++;
        console.log(`  ${GREEN}✓${RESET} ${testRecord.name}`);
      } else {
        failedTests++;
        console.log(`  ${RED}✗ ${testRecord.name}${RESET}`);
        if (testRecord.error) {
          console.log(`    ${RED}Error: ${testRecord.error.message}${RESET}`);
          if (testRecord.error.stack) {
            // Print only the relevant parts of the stack to keep it tidy
            const relevantStack = testRecord.error.stack
              .split('\n')
              .slice(0, 3)
              .join('\n      ');
            console.log(`      ${YELLOW}${relevantStack}${RESET}`);
          }
        }
      }
    });
    console.log();
  });

  console.log(`${BOLD}==================================================${RESET}`);
  console.log(`${BOLD}Test Summary:${RESET}`);
  console.log(`  Total:  ${totalTests}`);
  console.log(`  Passed: ${GREEN}${passedTests}${RESET}`);
  
  if (failedTests > 0) {
    console.log(`  Failed: ${RED}${failedTests}${RESET}`);
    console.log(`\n${RED}${BOLD}❌ SOME TESTS FAILED!${RESET}\n`);
    return false;
  } else {
    console.log(`  Failed: ${failedTests}`);
    console.log(`\n${GREEN}${BOLD}✨ ALL TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    return true;
  }
}
