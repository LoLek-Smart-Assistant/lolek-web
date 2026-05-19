import type { Assertion, AsymmetricMatchersContaining } from 'vitest'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare global {
  namespace Vi {
    interface Assertion<T = any>
      extends TestingLibraryMatchers<
        ReturnType<typeof expect.stringContaining>,
        T
      > {}
    interface AsymmetricMatchersContaining
      extends TestingLibraryMatchers<
        ReturnType<typeof expect.stringContaining>,
        string
      > {}
  }
}
