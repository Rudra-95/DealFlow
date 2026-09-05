class Validator {
  static assertExists(value, fieldName) {
    if (value === null || value === undefined) {
      throw new Error(`Validation failed: ${fieldName} is required`);
    }
  }

  static assertEqual(actual, expected, fieldName) {
    if (actual !== expected) {
      throw new Error(
        `Validation failed: ${fieldName} expected ${expected}, got ${actual}`
      );
    }
  }

  static assertGreaterThan(value, threshold, fieldName) {
    if (value <= threshold) {
      throw new Error(
        `Validation failed: ${fieldName} must be > ${threshold}, got ${value}`
      );
    }
  }

  static assertInArray(value, array, fieldName) {
    if (!array.includes(value)) {
      throw new Error(
        `Validation failed: ${fieldName} must be one of [${array.join(
          ", "
        )}], got ${value}`
      );
    }
  }

  static assertSuccess(response, operationName) {
    if (!response.success) {
      throw new Error(
        `Operation failed: ${operationName} - ${
          response.message || "Unknown error"
        }`
      );
    }
  }
}

module.exports = Validator;
