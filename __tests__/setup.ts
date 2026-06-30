// Global test setup — runs before every test file
import { vi } from 'vitest';

// Silence console.log/warn in tests unless a test explicitly checks them
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
