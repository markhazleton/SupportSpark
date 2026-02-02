import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
});
