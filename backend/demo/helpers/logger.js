class Logger {
  constructor() {
    this.stepNumber = 0;
  }

  step(message) {
    this.stepNumber++;
    console.log(`\n${"=".repeat(80)}`);
    console.log(`STEP ${this.stepNumber}: ${message}`);
    console.log("=".repeat(80));
  }

  success(message) {
    console.log(`✓ ${message}`);
  }

  error(message) {
    console.log(`✗ ${message}`);
  }

  info(message) {
    console.log(`ℹ ${message}`);
  }

  data(label, value) {
    console.log(`  ${label}: ${JSON.stringify(value, null, 2)}`);
  }

  header(title) {
    console.log(`\n${"#".repeat(80)}`);
    console.log(`# ${title}`);
    console.log("#".repeat(80));
  }

  section(title) {
    console.log(`\n${"-".repeat(80)}`);
    console.log(`  ${title}`);
    console.log("-".repeat(80));
  }
}

module.exports = Logger;
